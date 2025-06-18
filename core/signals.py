# community-finance-app/core/signals.py

from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings # Needed for settings.AUTH_USER_MODEL
from decimal import Decimal # Needed for Decimal('0.00')

# Import all models that your signals interact with
from .models import CustomUser, UserProfile, Wallet # <<< IMPORTANT: Add Wallet here

@receiver(post_save, sender=CustomUser)
def create_or_update_user_profile(sender, instance, created, **kwargs):
    """
    Signal handler to create or update UserProfile whenever a CustomUser is saved.
    """
    if created:
        # If a new user is created, create a blank UserProfile for them
        UserProfile.objects.create(user=instance)
        print(f"Created UserProfile for new user: {instance.username}")
    else:
        # If an existing user is updated, ensure their profile exists and save it
        # This handles cases where a user might exist but their profile was deleted
        # or not created for some reason.
        if hasattr(instance, 'profile'):
            instance.profile.save()
            # print(f"Updated UserProfile for existing user: {instance.username}") # Optional: keep commented for cleaner output
        else:
            # Re-create profile if it's missing for an existing user on update
            UserProfile.objects.create(user=instance)
            print(f"Re-created UserProfile for existing user: {instance.username}")


# <<< ADD THIS NEW SIGNAL HANDLER FOR WALLET CREATION >>>
@receiver(post_save, sender=CustomUser) # Or settings.AUTH_USER_MODEL, but CustomUser is fine too
def create_or_update_user_wallet(sender, instance, created, **kwargs):
    """
    Signal handler to create a Wallet whenever a CustomUser is saved (on creation).
    """
    if created:
        # If a new user is created, create a blank Wallet for them
        # Check if wallet already exists to prevent errors if manually created earlier
        if not hasattr(instance, 'wallet'):
            Wallet.objects.create(user=instance, balance=Decimal('0.00'))
            print(f"Created Wallet for new user: {instance.username}")
    else:
        # If an existing user is updated, ensure their wallet exists and save it
        # This is important for OneToOne relationships where the related object's save method
        # might need to be triggered when the parent is saved.
        if hasattr(instance, 'wallet'):
            instance.wallet.save()
            # print(f"Updated Wallet for existing user: {instance.username}") # Optional
        else:
            # This case might happen if a user was created, wallet was deleted,
            # and then user was updated without the wallet being re-created.
            Wallet.objects.create(user=instance, balance=Decimal('0.00'))
            print(f"Re-created Wallet for existing user: {instance.username}")