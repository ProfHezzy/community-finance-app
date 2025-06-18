# community-finance-app/users/forms.py (assuming this is your users app forms.py)

from django import forms
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from .models import CustomUser, UserProfile

class CustomUserCreationForm(UserCreationForm):
    """
    A custom form for creating a new user.
    Extends Django's UserCreationForm to include email and phone_number.
    """
    email = forms.EmailField(required=True, help_text='Required. Enter a valid email address.')
    phone_number = forms.CharField(max_length=20, required=False, 
                                   help_text="Optional. E.g., '+2348012345678'")

    class Meta(UserCreationForm.Meta):
        model = CustomUser
        fields = UserCreationForm.Meta.fields + ('email', 'phone_number',)
        # We explicitly list fields to ensure 'email' is used for USERNAME_FIELD
        # 'username' is still required by AbstractUser but will be handled by create_user in view
        # or can be set to email for simplicity, though email is primary login
        field_classes = {'username': forms.CharField} # Keep username in form for AbstractUser, but it's not the login field

    def clean_email(self):
        email = self.cleaned_data['email']
        if CustomUser.objects.filter(email=email).exists():
            raise forms.ValidationError("A user with that email already exists.")
        return email

    def save(self, commit=True):
        user = super().save(commit=False)
        user.email = self.cleaned_data["email"]
        user.phone_number = self.cleaned_data.get("phone_number")
        if commit:
            user.save()
            # The UserProfile will be created automatically by the post_save signal
            # in users/signals.py, so no need to create it here directly.
        return user

class UserProfileUpdateForm(forms.ModelForm):
    """
    Form for users to update their profile information.
    """
    class Meta:
        model = UserProfile
        exclude = ('user', 'is_kyc_verified', 'kyc_submitted_at', 'kyc_approved_at', 
                   'created_at', 'updated_at') # Fields managed by system, not direct user edit
        widgets = {
            'date_of_birth': forms.DateInput(attrs={'type': 'date', 'placeholder': 'YYYY-MM-DD'}),
            'address': forms.Textarea(attrs={'rows': 3}),
        }
        labels = {
            'bvn': 'Bank Verification Number',
            'nin': 'National Identity Number',
            'lga': 'Local Government Area',
            'profile_picture': 'Upload Profile Picture',
        }

class UserLoginForm(AuthenticationForm):
    """
    A custom login form to hint at email usage instead of username.
    """
    username = forms.CharField(
        label="Email Address",
        widget=forms.TextInput(attrs={'autofocus': True})
    )
    # The 'username' field in AuthenticationForm maps to CustomUser's USERNAME_FIELD (email)
    # No need to override clean method here unless custom authentication logic is needed beyond email/password.


# accounts/forms.py

from django import forms
from django.contrib.auth import get_user_model
from decimal import Decimal

User = get_user_model()

class FundWalletForm(forms.Form):
    amount = forms.DecimalField(
        min_value=Decimal('100.00'), # Minimum deposit amount, e.g., NGN 100
        max_digits=12,
        decimal_places=2,
        widget=forms.NumberInput(attrs={'placeholder': 'e.g., 5000', 'class': 'form-control'})
    )
    payment_method = forms.CharField(
        widget=forms.HiddenInput(), # This will be set by JS from radio buttons
        required=True
    )

    def clean_amount(self):
        amount = self.cleaned_data['amount']
        if amount <= 0:
            raise forms.ValidationError("Amount must be positive.")
        return amount

class WithdrawWalletForm(forms.Form):
    amount = forms.DecimalField(
        min_value=Decimal('100.00'), # Minimum withdrawal amount
        max_digits=12,
        decimal_places=2,
        widget=forms.NumberInput(attrs={'placeholder': 'e.g., 2000', 'class': 'form-control'})
    )
    # In a real app, you'd add bank account details here (e.g., bank name, account number)
    # For simplicity, we might just assume default bank info is set in user profile.

    def __init__(self, *args, **kwargs):
        self.user_wallet = kwargs.pop('user_wallet', None)
        super().__init__(*args, **kwargs)

    def clean_amount(self):
        amount = self.cleaned_data['amount']
        if amount <= 0:
            raise forms.ValidationError("Amount must be positive.")
        if self.user_wallet and amount > self.user_wallet.balance:
            raise forms.ValidationError("Insufficient balance for withdrawal.")
        return amount

class TransferWalletForm(forms.Form):
    amount = forms.DecimalField(
        min_value=Decimal('100.00'), # Minimum transfer amount
        max_digits=12,
        decimal_places=2,
        widget=forms.NumberInput(attrs={'placeholder': 'e.g., 1000', 'class': 'form-control'})
    )
    recipient_identifier = forms.CharField(
        max_length=150,
        widget=forms.TextInput(attrs={'placeholder': 'Recipient email or phone', 'class': 'form-control'}),
        help_text="Enter recipient's registered email or phone number."
    )

    def __init__(self, *args, **kwargs):
        self.sender_user = kwargs.pop('sender_user', None)
        super().__init__(*args, **kwargs)

    def clean_amount(self):
        amount = self.cleaned_data['amount']
        if amount <= 0:
            raise forms.ValidationError("Amount must be positive.")
        if self.sender_user and amount > self.sender_user.wallet.balance:
            raise forms.ValidationError("Insufficient balance for transfer.")
        return amount

    def clean_recipient_identifier(self):
        identifier = self.cleaned_data['recipient_identifier']
        # Try to find user by email or phone
        try:
            recipient_user = User.objects.get(email=identifier)
        except User.DoesNotExist:
            try:
                # Assuming you have a phone_number field in your User model or UserProfile
                # If phone is in UserProfile: recipient_user = User.objects.get(userprofile__phone_number=identifier)
                # If phone is directly in User:
                recipient_user = User.objects.get(phone_number=identifier)
            except User.DoesNotExist:
                raise forms.ValidationError("Recipient not found. Please use a registered email or phone number.")

        if self.sender_user and recipient_user == self.sender_user:
            raise forms.ValidationError("Cannot transfer funds to yourself.")

        return recipient_user # Return the user object, not just the identifier
    

from django import forms
from .models import SavingsGroup # Import your SavingsGroup model

class SavingsGroupForm(forms.ModelForm):
    # Optional: Add a widget for start_date to make it a date picker
    start_date = forms.DateField(
        widget=forms.DateInput(attrs={'type': 'date'}),
        label="Start Date"
    )
    end_date = forms.DateField(
        required=False, # Make end_date optional
        widget=forms.DateInput(attrs={'type': 'date'}),
        label="End Date (Optional)"
    )

    class Meta:
        model = SavingsGroup
        fields = [
            'name',
            'description',
            'contribution_amount',
            'contribution_frequency',
            'start_date',
            'end_date',
            'is_private', # If you want users to set this from the form
        ]
        labels = {
            'name': 'Group Name',
            'description': 'Description',
            'contribution_amount': 'Contribution Amount (₦)',
            'contribution_frequency': 'Contribution Frequency',
            'is_private': 'Make this a private group (requires invitation)?',
        }
        help_texts = {
            'description': 'A short description of your group.',
        }