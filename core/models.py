# community-finance-app/core/models.py

from django.db import models
from django.core.validators import RegexValidator
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _
from django.utils import timezone # Keep for potential future use, though auto_now/add handle current needs
from django.db.models import Q # Keep for potential future query use
from simple_history.models import HistoricalRecords
from django.db.models.signals import post_save
from django.dispatch import receiver

# Define choices for Account Type and Gender
ACCOUNT_TYPE_CHOICES = [
    ('individual', 'Individual'),
    ('group', 'Group'),
]

GENDER_CHOICES = [
    ('male', 'Male'),
    ('female', 'Female'),
    ('other', 'Other'),
]

class CustomUser(AbstractUser):
    """
    Custom User model extending Django's AbstractUser.
    We are making email the primary unique identifier for login.
    """
    email = models.EmailField(_('email address'), unique=True)
    
    # Phone number validation for common formats (e.g., Nigerian numbers)
    phone_regex = RegexValidator(
        regex=r'^\+?1?\d{9,15}$', # Allows optional + prefix and 9-15 digits
        message="Phone number must be entered in the format: '+2341234567890'. Up to 15 digits allowed."
    )
    phone_number = models.CharField(
        max_length=20, # Max length for international numbers
        validators=[phone_regex],
        unique=True,
        null=True,
        blank=True
    )
    
    # Track user status (active/suspended)
    is_active = models.BooleanField(default=True, 
                                    help_text="Designates whether this user should be treated as active. "
                                              "Unselect this instead of deleting accounts.")
    is_suspended = models.BooleanField(default=False, 
                                       help_text="Designates whether the user's account has been suspended.")
    
    # Timestamps
    date_joined = models.DateTimeField(auto_now_add=True)
    last_updated = models.DateTimeField(auto_now=True)

    # Use email as the USERNAME_FIELD for authentication
    USERNAME_FIELD = 'email'
    # REQUIRED_FIELDS are prompted when creating a user via createsuperuser
    REQUIRED_FIELDS = ['username']  # Keep username for superuser creation, but not used for login

    def __str__(self):
        return self.email

    class Meta:
        verbose_name = "Custom User"
        verbose_name_plural = "Custom Users"


class UserProfile(models.Model):
    """
    Model to store additional profile information for a CustomUser.
    This uses a OneToOneField to link directly to our CustomUser.
    Includes HistoricalRecords for auditing changes.
    """
    history = HistoricalRecords() # Keep historical records for this model

    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='profile')
    
    # Personal & Demographic Information
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, null=True, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)

    # KYC Fields with validators
    # Using CharField as per your latest snippet's structure, 
    # but be aware that sensitive data might require encryption in production.
    bvn = models.CharField(
        max_length=11,
        unique=True,
        null=True,
        blank=True,
        validators=[RegexValidator(r'^\d{11}$', 'BVN must be 11 digits.')],
        help_text="Bank Verification Number (11 digits)"
    )
    nin = models.CharField(
        max_length=11,
        unique=True,
        null=True,
        blank=True,
        validators=[RegexValidator(r'^\d{11}$', 'NIN must be 11 digits.')],
        verbose_name="National Identity Number (NIN)",
        help_text="National Identity Number (11 digits)"
    )
    
    # Location Fields
    address = models.TextField(max_length=500, null=True, blank=True)
    city = models.CharField(max_length=100, null=True, blank=True)
    state = models.CharField(max_length=100, null=True, blank=True)
    lga = models.CharField(max_length=100, null=True, blank=True, verbose_name="Local Government Area")
    country = models.CharField(max_length=100, default="Nigeria") # Default to Nigeria

    # Account Type and Financial Preferences
    account_type = models.CharField(max_length=15, choices=ACCOUNT_TYPE_CHOICES, default='individual',
                                    help_text="Type of account: Individual or Group/Cooperative")
    preferred_currency = models.CharField(
        max_length=3,
        default="NGN",
        choices=[('NGN', 'Naira'), ('USD', 'Dollar')]
    )
    
    # Verification & Metadata
    profile_picture = models.ImageField(upload_to='profile_pics/', null=True, blank=True)
    is_kyc_verified = models.BooleanField(default=False, 
                                           help_text="Indicates if the user's KYC documents have been verified.")
    kyc_submitted_at = models.DateTimeField(null=True, blank=True)
    kyc_approved_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "User Profile"
        verbose_name_plural = "User Profiles"
        indexes = [
            models.Index(fields=['bvn']),
            models.Index(fields=['nin']),
        ]

    def __str__(self):
        return f"{self.user.email}'s Profile"


class SavingsGroup(models.Model):
    """
    Represents a savings group (Ajo/Esusu circle).
    """
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    creator = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='created_groups')
    members = models.ManyToManyField(CustomUser, through='GroupMembership', related_name='savings_groups')
    contribution_amount = models.DecimalField(max_digits=10, decimal_places=2)
    contribution_frequency = models.CharField(
        max_length=10,
        choices=[('daily', 'Daily'), ('weekly', 'Weekly'), ('monthly', 'Monthly')],
        help_text="How often contributions are made (e.g., 'weekly')"
    )
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True, help_text="Optional end date for the group")
    is_active = models.BooleanField(default=True, help_text="Is the group currently active?")
    is_private = models.BooleanField(default=False, help_text="Is this a private group (requires invitation)?")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    target_amount = models.DecimalField(
        max_digits=12,         # Adjust max_digits as per your expected maximum amount
        decimal_places=2,      # Standard for currency
        null=True,             # Allow groups without a fixed target
        blank=True,            # Allow blank in forms
        help_text="The total target amount for the group (e.g., for Esusu or a target-based Ajo)"
    )

    def add_member(self, user):
        """Adds a user to the savings group."""
        if not self.members.filter(pk=user.pk).exists():
            GroupMembership.objects.create(user=user, group=self)

    def __str__(self):
        return f"{self.name} (₦{self.contribution_amount} {self.get_contribution_frequency_display()})"

    class Meta:
        verbose_name = "Savings Group"
        verbose_name_plural = "Savings Groups"
        ordering = ['-created_at']


class GroupMembership(models.Model):
    """
    Represents a user's membership in a SavingsGroup.
    """
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    group = models.ForeignKey(SavingsGroup, on_delete=models.CASCADE)
    date_joined = models.DateTimeField(auto_now_add=True)
    is_admin = models.BooleanField(default=False, help_text="Does this member have admin privileges in the group?")
    has_contributed_this_period = models.BooleanField(default=False)

    class Meta:
        unique_together = ('user', 'group') # A user can only be in a specific group once
        verbose_name = "Group Membership"
        verbose_name_plural = "Group Memberships"
        ordering = ['date_joined']

    def __str__(self):
        return f"{self.user.email} in {self.group.name}"
    
from django.conf import settings
from django.db.models.signals import post_save
from decimal import Decimal
class Wallet(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='wallet')
    balance = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00')) # Increased max_digits
    total_deposits = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    total_withdrawals = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username}'s Wallet (₦{self.balance:.2f})"

    def fund(self, amount):
        if amount <= 0:
            return False
        self.balance += amount
        self.total_deposits += amount
        self.save()
        return True

    def withdraw(self, amount):
        if amount <= 0 or self.balance < amount:
            return False
        self.balance -= amount
        self.total_withdrawals += amount
        self.save()
        return True

    # Note: For real-world use, these simple methods need to be wrapped in
    # database transactions to ensure atomicity and data integrity.

#======================= Invitation =====================================>
class Invitation(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
        ('expired', 'Expired'),
    ]

    # The user who sent the invitation
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sent_invitations',
        help_text="The user who sent this invitation."
    )
    # The user who is invited (can be null if inviting by email to a non-existent user)
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name='received_invitations',
        null=True, blank=True,
        help_text="The user who received this invitation (if they have an account)."
    )
    # If inviting by email to a user who might not have an account yet
    recipient_email = models.EmailField(
        max_length=254,
        null=True, blank=True,
        help_text="Email address of the recipient if they don't have an account yet."
    )

    group = models.ForeignKey(
        'SavingsGroup', # References your SavingsGroup model
        on_delete=models.CASCADE,
        related_name='invitations',
        help_text="The group this invitation is for."
    )
    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default='pending'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(
        null=True, blank=True,
        help_text="When this invitation link expires."
    )
    # A unique token for link-based invitations (e.g., for public sharing or email invites)
    token = models.CharField(
        max_length=64,
        unique=True,
        null=True, blank=True, # Allow null if token is not always generated/used
        help_text="Unique token for accepting the invitation via a link."
    )

    class Meta:
        # Prevent duplicate pending invitations from the same sender to the same recipient for the same group
        # or prevent duplicate pending email invitations for the same group.
        # This unique_together might need refinement based on exact invite flow.
        unique_together = [
            ('sender', 'recipient', 'group', 'status'),
            ('recipient_email', 'group', 'status')
        ]
        verbose_name = "Group Invitation"
        verbose_name_plural = "Group Invitations"
        ordering = ['-created_at']

    def __str__(self):
        recipient_info = self.recipient.username if self.recipient else self.recipient_email
        return f"Invitation for {recipient_info} to {self.group.name} ({self.status})"

    def save(self, *args, **kwargs):
        # Generate a token if it's a new invitation and no token is provided
        if not self.pk and not self.token:
            import uuid
            self.token = uuid.uuid4().hex # Generate a unique hexadecimal token

        # Set an expiry date if not already set (e.g., 7 days from creation)
        if not self.expires_at and self.status == 'pending':
            self.expires_at = timezone.now() + timedelta(days=7) # Expires in 7 days

        super().save(*args, **kwargs)

    def is_expired(self):
        return self.expires_at and self.expires_at < timezone.now()

    def accept(self):
        if self.status == 'pending' and not self.is_expired():
            # If recipient_email was used, find or create the user
            if self.recipient_email and not self.recipient:
                # You'd need logic here to map the email to an existing user or
                # prompt the user to register/login.
                # For simplicity, if a user exists with that email, link them.
                try:
                    self.recipient = CustomUser.objects.get(email=self.recipient_email)
                except CustomUser.DoesNotExist:
                    # Handle case where user needs to register first.
                    # For a real app, this would redirect to registration or pre-fill form.
                    # For now, let's just not set recipient if not found.
                    pass

            if self.recipient: # Only add if we have a linked user account
                # Add the recipient to the group as a regular member
                GroupMembership.objects.get_or_create(user=self.recipient, group=self)
                self.status = 'accepted'
                self.save()
                return True
            else:
                # Cannot accept if no linked recipient (e.g., email user hasn't registered)
                return False
        return False

    def reject(self):
        if self.status == 'pending':
            self.status = 'rejected'
            self.save()
            return True
        return False


import uuid
class Transaction(models.Model):
    TRANSACTION_TYPES = [
        ('deposit', 'Deposit'),
        ('withdrawal', 'Withdrawal'),
        ('transfer', 'Transfer'),
        ('contribution', 'Group Contribution'),
        ('payout', 'Group Payout'),
    ]
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('reversed', 'Reversed'),
    ]

    wallet = models.ForeignKey(
        'Wallet', # References the Wallet model defined in the same file
        on_delete=models.CASCADE,
        related_name='transactions',
        default=0,
        help_text="The wallet primarily associated with this transaction."
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='completed')
    timestamp = models.DateTimeField(auto_now_add=True)
    description = models.TextField(blank=True, null=True)

    # For transfers, or to identify the initiator/receiver of funds
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL, # References your CustomUser model
        on_delete=models.SET_NULL, # Don't delete transaction if sender user is deleted
        related_name='sent_transactions',
        null=True, blank=True,
        help_text="User who initiated the transaction (e.g., sender in a transfer, or user making a deposit/withdrawal)"
    )
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL, # References your CustomUser model
        on_delete=models.SET_NULL,
        related_name='received_transactions',
        null=True, blank=True,
        help_text="User who is the receiver of funds (e.g., recipient in a transfer, or user receiving a payout)"
    )

    group = models.ForeignKey(
        'SavingsGroup',  # CORRECTED: References the SavingsGroup model defined in the same file
        on_delete=models.SET_NULL,
        related_name='group_transactions',
        null=True, blank=True,
        help_text="Associated savings group for 'contribution' or 'payout' transaction types."
    )
    reference = models.CharField(
        max_length=100,
        unique=True, # Ensures each reference is unique
        blank=True,
        null=True,
        help_text="Unique transaction reference (e.g., from payment gateway, or system-generated ID)."
    )

    class Meta:
        ordering = ['-timestamp'] # Default ordering for querying transactions
        verbose_name = "Financial Transaction"
        verbose_name_plural = "Financial Transactions"
        # Optional: Add indexes for frequently queried fields for performance
        indexes = [
            models.Index(fields=['transaction_type']),
            models.Index(fields=['status']),
            models.Index(fields=['timestamp']),
            models.Index(fields=['wallet']),
            models.Index(fields=['sender']),
            models.Index(fields=['recipient']),
            models.Index(fields=['group']),
        ]

    def __str__(self):
        # Provides a human-readable representation of the transaction
        user_info = self.wallet.user.username if self.wallet and self.wallet.user else "N/A User"
        return f"{self.get_transaction_type_display()} of ₦{self.amount:.2f} for {user_info} ({self.status})"

    def save(self, *args, **kwargs):
        # Automatically generate a unique reference for completed transactions if not provided
        if not self.reference and self.status == 'completed':
            # Generate a UUID and take the first 20 characters for brevity
            # Consider a more robust reference generation for production if UUIDs aren't suitable
            self.reference = str(uuid.uuid4()).replace('-', '')[:20]
        super().save(*args, **kwargs)

@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)

# THIS IS THE CRUCIAL ONE FOR YOUR CURRENT PROBLEM:
@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_user_wallet(sender, instance, created, **kwargs):
    if created:
        # Check if a wallet already exists for the user (optional, but good for robustness)
        if not hasattr(instance, 'wallet'):
            Wallet.objects.create(user=instance, balance=Decimal('0.00'))
            print(f"DEBUG: Wallet created for user: {instance.username} ({instance.email})") # Add this line for terminal feedback

# This signal saves the UserProfile when the CustomUser is saved
@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def save_user_profile(sender, instance, **kwargs):
    instance.profile.save()

# This signal saves the Wallet when the CustomUser is saved
@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def save_user_wallet(sender, instance, **kwargs):
    if hasattr(instance, 'wallet'): # Ensure wallet exists before trying to save
        instance.wallet.save()