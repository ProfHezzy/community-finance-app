# community-finance-app/users/admin.py

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _

# Import SimpleHistoryAdmin for models with HistoricalRecords
from simple_history.admin import SimpleHistoryAdmin

# IMPORTANT: Ensure all your models are imported correctly from their respective locations
# If Wallet is in a different app/models.py, adjust the import path.
# Assuming all models are in 'users.models' for simplicity here.
from .models import CustomUser, UserProfile, SavingsGroup, GroupMembership, Transaction, Wallet # Make sure Wallet is imported

# Define a custom admin class for CustomUser
# This extends the default Django UserAdmin for better integration
class CustomUserAdmin(BaseUserAdmin):
    # Add email and phone_number to fieldsets for easier management
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        (_('Personal info'), {'fields': ('first_name', 'last_name', 'email', 'phone_number')}),
        (_('Permissions'), {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'is_suspended', 'groups', 'user_permissions'),
        }),
        (_('Important dates'), {'fields': ('last_login', 'date_joined', 'last_updated')}),
    )
    list_display = ('email', 'username', 'first_name', 'last_name', 'phone_number', 'is_staff', 'is_active', 'is_suspended', 'date_joined')
    list_filter = ('is_staff', 'is_active', 'is_superuser', 'is_suspended', 'groups')
    search_fields = ('email', 'username', 'first_name', 'last_name', 'phone_number')
    ordering = ('-date_joined',)

# Define admin for UserProfile, integrating SimpleHistoryAdmin
class UserProfileAdmin(SimpleHistoryAdmin):
    list_display = ('user', 'account_type', 'bvn', 'nin', 'country', 'is_kyc_verified', 'kyc_submitted_at', 'kyc_approved_at')
    list_filter = ('account_type', 'is_kyc_verified', 'preferred_currency', 'country')
    search_fields = ('user__email', 'user__first_name', 'user__last_name', 'bvn', 'nin', 'lga', 'city')
    # Use raw_id_fields for ForeignKey/OneToOneField to avoid loading all users in dropdown
    raw_id_fields = ('user',)
    readonly_fields = ('kyc_submitted_at', 'kyc_approved_at', 'created_at', 'updated_at') # Read-only for system fields
    fieldsets = (
        (None, {'fields': ('user', 'profile_picture', 'account_type', 'gender', 'date_of_birth')}),
        (_('KYC Information'), {'fields': ('bvn', 'nin', 'is_kyc_verified', 'kyc_submitted_at', 'kyc_approved_at')}),
        (_('Location'), {'fields': ('address', 'city', 'state', 'lga', 'country')}),
        (_('Preferences'), {'fields': ('preferred_currency',)}),
        (_('Timestamps'), {'fields': ('created_at', 'updated_at')}),
    )

# Admin for SavingsGroup
class SavingsGroupAdmin(admin.ModelAdmin):
    list_display = ('name', 'creator', 'contribution_amount', 'contribution_frequency', 'start_date', 'is_active', 'created_at')
    list_filter = ('contribution_frequency', 'is_active', 'created_at')
    search_fields = ('name', 'creator__email')
    raw_id_fields = ('creator',)
    # Removed: filter_horizontal = ('members',) <--- THIS WAS THE CAUSE OF THE ERROR (Good, you removed it!)

# Admin for GroupMembership
class GroupMembershipAdmin(admin.ModelAdmin):
    list_display = ('user', 'group', 'date_joined', 'is_admin')
    list_filter = ('is_admin', 'date_joined', 'group')
    search_fields = ('user__email', 'group__name')
    raw_id_fields = ('user', 'group',) # Use raw_id_fields for both ForeignKeys

# Admin for Transaction
class TransactionAdmin(admin.ModelAdmin):
    list_display = (
        'wallet_user_email', # Displays the email of the user associated with the wallet
        'transaction_type',
        'amount',
        'status',
        'timestamp',
        'get_group_name',    # Custom method to display the group name
        'reference',         # Now a direct field on the Transaction model
        'sender_email',      # Custom method to display sender's email
        'recipient_email',   # Custom method to display recipient's email
    )
    list_filter = (
        'transaction_type',
        'status',
        'timestamp',
        'group',             # Now a direct ForeignKey field on the Transaction model
    )
    search_fields = (
        'wallet__user__email', # Search by email of the user linked via the wallet
        'reference',
        'group__name',       # Search by group name (assuming SavingsGroup has a 'name' field)
        'description',
        'sender__email',     # Search by sender's email
        'recipient__email',  # Search by recipient's email
    )
    raw_id_fields = (
        'wallet',            # Link to the Wallet model
        'sender',            # Link to the CustomUser model (sender)
        'recipient',         # Link to the CustomUser model (recipient)
        'group',             # Link to the SavingsGroup model
    )
    readonly_fields = ('timestamp',) # Timestamp is auto_now_add, so make it read-only

    # Custom method to get the email of the user associated with the wallet
    def wallet_user_email(self, obj):
        return obj.wallet.user.email if obj.wallet and obj.wallet.user else "N/A"
    wallet_user_email.short_description = 'Wallet User Email' # Column header

    # Custom method to get the name of the associated group
    def get_group_name(self, obj):
        return obj.group.name if obj.group else "N/A"
    get_group_name.short_description = 'Group'

    # Custom method to get the sender's email
    def sender_email(self, obj):
        return obj.sender.email if obj.sender else "N/A"
    sender_email.short_description = 'Sender'

    # Custom method to get the recipient's email
    def recipient_email(self, obj):
        return obj.recipient.email if obj.recipient else "N/A"
    recipient_email.short_description = 'Recipient'


# Register your models here
admin.site.register(CustomUser, CustomUserAdmin)
admin.site.register(UserProfile, UserProfileAdmin)
admin.site.register(SavingsGroup, SavingsGroupAdmin)
admin.site.register(GroupMembership, GroupMembershipAdmin)
admin.site.register(Transaction, TransactionAdmin)