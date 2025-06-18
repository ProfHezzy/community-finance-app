from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.urls import reverse
from django.db.models import Sum, Q
from django.utils import timezone
from datetime import timedelta, datetime
from django.core.paginator import Paginator
from decimal import Decimal
from django.db import transaction as db_transaction

# Assuming forms are correctly defined and imported.
from .forms import UserLoginForm # This might be from an 'accounts' app, ensure correct import path
from core.forms import CustomUserCreationForm, UserProfileUpdateForm, SavingsGroupForm, FundWalletForm, WithdrawWalletForm, TransferWalletForm
from core.models import UserProfile, SavingsGroup, GroupMembership, Transaction, Wallet, Invitation
from django.contrib.auth import get_user_model

User = get_user_model()

def index(request):
    return render(request, 'index.html')

@login_required
def dashboard_view(request):
    """
    Displays the user's dashboard with dynamic data.
    """
    wallet, created = Wallet.objects.get_or_create(user=request.user) # Ensure wallet exists

    active_groups = SavingsGroup.objects.filter(members=request.user, is_active=True).count()
    total_transactions = Transaction.objects.filter(wallet__user=request.user).count()

    # Calculate total savings (sum of all deposits)
    total_savings = Transaction.objects.filter(wallet__user=request.user, transaction_type='deposit').aggregate(Sum('amount'))['amount__sum'] or Decimal('0.00')

    # Calculate percentage change in savings from last month
    today = timezone.now()
    last_month_start = today - timedelta(days=30)
    month_before_last_start = last_month_start - timedelta(days=30)

    savings_this_month = Transaction.objects.filter(
        wallet__user=request.user,
        transaction_type='deposit',
        timestamp__gte=last_month_start,
        timestamp__lte=today
    ).aggregate(Sum('amount'))['amount__sum'] or Decimal('0.00')

    savings_last_month = Transaction.objects.filter(
        wallet__user=request.user,
        transaction_type='deposit',
        timestamp__gte=month_before_last_start,
        timestamp__lte=last_month_start
    ).aggregate(Sum('amount'))['amount__sum'] or Decimal('0.00')

    if savings_last_month != Decimal('0.00'):
        savings_percentage_change = ((savings_this_month - savings_last_month) / savings_last_month) * 100
    else:
        savings_percentage_change = 0 # Or handle as a special case if no previous savings

    # Get recent transactions
    recent_transactions = Transaction.objects.filter(wallet__user=request.user).order_by('-timestamp')[:5]

    # Get upcoming payouts (This part needs more concrete logic based on your group payout system)
    # For now, it's just showing active groups. You'd need to define what constitutes a "payout"
    upcoming_payouts = SavingsGroup.objects.filter(members=request.user, is_active=True).order_by('start_date')[:3] # Example

    # Get savings groups
    savings_groups = SavingsGroup.objects.filter(members=request.user).order_by('-created_at')[:3]

    context = {
        'total_savings': total_savings,
        'active_groups': active_groups,
        'total_transactions': total_transactions,
        'savings_percentage_change': round(savings_percentage_change, 2), # Round for display
        'recent_transactions': recent_transactions,
        'upcoming_payouts': upcoming_payouts,
        'savings_groups': savings_groups,
        'wallet': wallet, # Pass wallet to dashboard
    }
    return render(request, 'dashboard.html', context)


def register_view(request):
    """
    Handles user registration.
    """
    if request.user.is_authenticated:
        return redirect(reverse('profile_view')) # Use reverse

    if request.method == 'POST':
        form = CustomUserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user) # Log the user in immediately after registration
            messages.success(request, f"Account created successfully! Welcome, {user.email}.")
            return redirect(reverse('profile_view')) # Use reverse
        else:
            for field, errors in form.errors.items():
                for error in errors:
                    messages.error(request, f"{field.replace('_', ' ').title()}: {error}")
    else:
        form = CustomUserCreationForm()
    return render(request, 'register.html', {'form': form})

def login_view(request):
    """
    Handles user login.
    """
    if request.user.is_authenticated:
        return redirect(reverse('profile_view')) # Use reverse

    if request.method == 'POST':
        form = UserLoginForm(request, data=request.POST) # 'request' is required for AuthenticationForm
        if form.is_valid():
            user = form.get_user()
            login(request, user)
            messages.success(request, f"Welcome back, {user.email}!")
            next_url = request.GET.get('next') or request.POST.get('next')
            if next_url:
                return redirect(next_url)
            return redirect(reverse('profile_view')) # Use reverse
        else:
            messages.error(request, "Invalid email or password.")
    else:
        form = UserLoginForm()

    next_url = request.GET.get('next')
    return render(request, 'login.html', {'form': form, 'next': next_url})


@login_required # Ensures only logged-in users can access this view
def logout_view(request):
    """
    Logs out the current user.
    """
    logout(request)
    messages.info(request, "You have been logged out.")
    return redirect(reverse('index')) # Use reverse

@login_required
def profile_view(request):
    try:
        profile = request.user.profile
    except UserProfile.DoesNotExist:
        profile = UserProfile.objects.create(user=request.user)
        messages.info(request, "Your profile has been automatically created. Please update your details.")

    if request.method == 'POST':
        profile_form = UserProfileUpdateForm(request.POST, request.FILES, instance=profile)
        if profile_form.is_valid():
            profile_form.save()
            messages.success(request, 'Your profile was successfully updated!')
            return redirect(reverse('profile_view')) # Use reverse
        else:
            messages.error(request, 'Please correct the errors below.')
    else:
        profile_form = UserProfileUpdateForm(instance=profile)

    context = {
        'profile': profile,
        'profile_form': profile_form
    }
    return render(request, 'profile.html', context)


# accounts/views.py (or wallet views)
# This part is treated as if it's logically part of core's views due to initial structure

from django.db import transaction as db_transaction # Avoid naming conflict with our Transaction model

@login_required
def wallet_view(request):
    user_wallet = get_object_or_404(Wallet, user=request.user)

    # --- Transaction Filtering Logic ---
    transactions_list = user_wallet.transactions.all().order_by('-timestamp') # Default order

    # Filter by type
    transaction_type_filter = request.GET.get('type', 'all')
    if transaction_type_filter != 'all':
        transactions_list = transactions_list.filter(transaction_type=transaction_type_filter)

    # Filter by period
    transaction_period_filter = request.GET.get('period', '30days')
    if transaction_period_filter == '7days':
        start_date = timezone.now() - timedelta(days=7)
    elif transaction_period_filter == '30days':
        start_date = timezone.now() - timedelta(days=30)
    elif transaction_period_filter == '90days':
        start_date = timezone.now() - timedelta(days=90)
    else: # 'all'
        start_date = None

    if start_date:
        transactions_list = transactions_list.filter(timestamp__gte=start_date)

    # --- Pagination ---
    paginator = Paginator(transactions_list, 10) # Show 10 transactions per page
    page_number = request.GET.get('page')
    transactions = paginator.get_page(page_number)

    # Get the last transaction for the summary card (already ordered by '-timestamp' above)
    last_transaction = transactions_list.first()

    # Forms for wallet actions (passed to template for modals/includes)
    fund_form = FundWalletForm()
    withdraw_form = WithdrawWalletForm(user_wallet=user_wallet) # Pass user_wallet to form
    transfer_form = TransferWalletForm(sender_user=request.user) # Pass sender_user to form

    context = {
        'user': request.user,
        'wallet': user_wallet,
        'transactions': transactions,
        'last_transaction': last_transaction,
        'selected_type': transaction_type_filter,
        'selected_period': transaction_period_filter,
        'fund_form': fund_form,
        'withdraw_form': withdraw_form,
        'transfer_form': transfer_form,
    }
    return render(request, 'wallet.html', context)


@login_required
def process_wallet_action(request):
    if request.method == 'POST':
        action_type = request.POST.get('transaction_type')
        user_wallet = get_object_or_404(Wallet, user=request.user)

        if action_type == 'fund':
            form = FundWalletForm(request.POST)
            if form.is_valid():
                amount = form.cleaned_data['amount']
                payment_method = form.cleaned_data['payment_method']

                with db_transaction.atomic():
                    if user_wallet.fund(amount):
                        Transaction.objects.create(
                            wallet=user_wallet,
                            amount=amount,
                            transaction_type='deposit',
                            status='completed',
                            description=f"Funds added via {payment_method.replace('_', ' ').title()}"
                        )
                        messages.success(request, f"Successfully funded your wallet with ₦{amount:,.2f}.")
                    else:
                        messages.error(request, "Failed to fund wallet.")
                return redirect(reverse('wallet_view'))
            else:
                for field, errors in form.errors.items():
                    for error in errors:
                        messages.error(request, f"Fund Wallet - {field}: {error}")
                return redirect(reverse('wallet_view'))

        elif action_type == 'withdraw':
            form = WithdrawWalletForm(request.POST, user_wallet=user_wallet)
            if form.is_valid():
                amount = form.cleaned_data['amount']
                with db_transaction.atomic():
                    if user_wallet.withdraw(amount):
                        Transaction.objects.create(
                            wallet=user_wallet,
                            amount=amount,
                            transaction_type='withdrawal',
                            status='pending',
                            description="Withdrawal to bank account"
                        )
                        messages.success(request, f"Withdrawal of ₦{amount:,.2f} initiated. It will be processed shortly.")
                    else:
                        messages.error(request, "Withdrawal failed. Check your balance.")
                return redirect(reverse('wallet_view'))
            else:
                for field, errors in form.errors.items():
                    for error in errors:
                        messages.error(request, f"Withdrawal - {field}: {error}")
                return redirect(reverse('wallet_view'))

        elif action_type == 'transfer':
            form = TransferWalletForm(request.POST, sender_user=request.user)
            if form.is_valid():
                amount = form.cleaned_data['amount']
                recipient_user = form.cleaned_data['recipient_identifier']

                with db_transaction.atomic():
                    sender_wallet = request.user.wallet
                    recipient_wallet, created = Wallet.objects.get_or_create(user=recipient_user) # Ensure recipient has a wallet

                    if sender_wallet.withdraw(amount): # Deduct from sender
                        recipient_wallet.fund(amount) # Add to recipient

                        # Create transaction for sender
                        Transaction.objects.create(
                            wallet=sender_wallet,
                            amount=amount,
                            transaction_type='transfer',
                            status='completed',
                            sender=request.user,
                            recipient=recipient_user,
                            description=f"Transfer to {recipient_user.get_full_name() or recipient_user.username}"
                        )
                        # Create transaction for recipient
                        Transaction.objects.create(
                            wallet=recipient_wallet,
                            amount=amount,
                            transaction_type='transfer',
                            status='completed',
                            sender=request.user,
                            recipient=recipient_user,
                            description=f"Received from {request.user.get_full_name() or request.user.username}"
                        )
                        messages.success(request, f"Successfully transferred ₦{amount:,.2f} to {recipient_user.get_full_name() or recipient_user.username}.")
                    else:
                        messages.error(request, "Transfer failed. Insufficient balance.")
                return redirect(reverse('wallet_view'))
            else:
                for field, errors in form.errors.items():
                    for error in errors:
                        messages.error(request, f"Transfer - {field}: {error}")
                return redirect(reverse('wallet_view'))

        else:
            messages.error(request, "Invalid wallet action.")
            return redirect(reverse('wallet_view'))
    else:
        return redirect(reverse('wallet_view'))


## Savings Group Views

@login_required
def group_list_view(request): # Corrected: No group_id parameter
    """
    Displays a list of savings groups the user is a member of,
    along with any pending invitations and discoverable public groups.
    """
    # Groups the user is a direct member of
    my_memberships = GroupMembership.objects.filter(user=request.user)
    my_groups = [membership.group for membership in my_memberships]

    # Get IDs of groups the user is already a member of, to exclude them from discoverable
    my_group_ids = [group.id for group in my_groups]

    # --- Search and Filter for Discoverable Groups ---
    search_query = request.GET.get('search', '').strip()
    discoverable_groups_list = SavingsGroup.objects.filter(
        is_private=False
    ).exclude(
        id__in=my_group_ids
    ).order_by('-created_at')

    if search_query:
        discoverable_groups_list = discoverable_groups_list.filter(
            Q(name__icontains=search_query) |
            Q(description__icontains=search_query)
        )

    # --- Pagination for Discoverable Groups ---
    paginator = Paginator(discoverable_groups_list, 5) # Show 5 discoverable groups per page
    page_number = request.GET.get('page')
    discoverable_groups = paginator.get_page(page_number)

    # Invitations for the current user
    invitations = Invitation.objects.filter(
        Q(recipient=request.user) | Q(recipient_email=request.user.email),
        status='pending',
        expires_at__gte=timezone.now()
    ).order_by('-created_at')

    # Calculate group progress dynamically for 'my_groups'
    for group in my_groups:
        group.current_amount = Transaction.objects.filter(
            group=group,
            transaction_type='contribution'
        ).aggregate(Sum('amount'))['amount__sum'] or Decimal('0.00')

        group.percent_complete = (group.current_amount / group.target_amount) * 100 if group.target_amount and group.target_amount > 0 else 0
        group.percent_complete = min(round(group.percent_complete, 2), 100) # Round and cap at 100

        if group.percent_complete >= 100:
            group.status = 'completed'
        else:
            group.status = 'active'

    # Form for creating a new group (passed to template for modal/include)
    create_group_form = SavingsGroupForm()

    context = {
        'my_groups': my_groups,
        'discoverable_groups': discoverable_groups,
        'invitations': invitations,
        'page_title': 'My Groups & Discover',
        'create_group_form': create_group_form, # Pass the form to the template
        'search_query': search_query, # Pass the search query back to the template
    }
    return render(request, 'group_list.html', context)


@login_required
def group_create_view(request):
    """
    Handles the creation of a new savings group using a form.
    """
    if request.method == 'POST':
        form = SavingsGroupForm(request.POST)
        if form.is_valid():
            group = form.save(commit=False) # Don't save yet, need to add creator
            group.creator = request.user
            group.save() # Now save the group

            # Add the creator as a member of the group
            GroupMembership.objects.create(user=request.user, group=group, is_admin=True) # Creator is admin

            messages.success(request, f"Savings group '{group.name}' created successfully!")
            return redirect(reverse('group_list_view')) # Use reverse
        else:
            # If form is invalid, re-render the group list with errors
            # This assumes the create form is part of the group_list.html or a modal there.
            # For better UX, consider an AJAX submission or redirecting back with errors.
            for field, errors in form.errors.items():
                for error in errors:
                    messages.error(request, f"Group Creation - {field.replace('_', ' ').title()}: {error}")
            # Redirect to group list to display errors, keeping current search/page parameters if any
            return redirect(f"{reverse('group_list_view')}?{'&'.join([f'{k}={v}' for k, v in request.GET.items()])}")
    else:
        # If it's a GET request to /groups/create/, simply redirect to group list
        # as the form is expected to be part of the group_list_view
        return redirect(reverse('group_list_view'))


@login_required
def group_detail_view(request, group_id): # Parameter name is group_id to match urls.py
    """
    Displays the details of a specific savings group.
    """
    try:
        # Fetch the group. Ensure the user is a member or the group is public.
        # For strict membership check:
        group = SavingsGroup.objects.get(pk=group_id, members=request.user) # Correct: Using pk for lookup
        is_member = True
    except SavingsGroup.DoesNotExist:
        # If user is not a member, check if it's a public group to allow viewing
        group = get_object_or_404(SavingsGroup, pk=group_id) # Correct: Using pk for lookup
        if group.is_private:
            messages.error(request, "The group does not exist or you are not authorized to view it.")
            return redirect(reverse('group_list_view')) # Correct: No kwargs here
        is_member = False # User can view but is not a member

    # --- Dynamic Progress Calculation for the single group ---
    group.current_amount = Transaction.objects.filter(
        group=group,
        transaction_type='contribution'
    ).aggregate(Sum('amount'))['amount__sum'] or Decimal('0.00')

    group.percent_complete = (group.current_amount / group.target_amount) * 100 \
                             if group.target_amount and group.target_amount > 0 else 0
    group.percent_complete = min(round(group.percent_complete, 2), 100) # Round and cap at 100

    if group.percent_complete >= 100:
        group.status = 'completed'
    else:
        group.status = 'active'
    # --- End Dynamic Progress Calculation ---

    # Fetch related members and transactions
    group_memberships = GroupMembership.objects.filter(group=group).order_by('date_joined')
    group_transactions = Transaction.objects.filter(group=group).order_by('-timestamp')

    context = {
        'group': group,
        'group_memberships': group_memberships,
        'group_transactions': group_transactions,
        'page_title': group.name,
        'is_member': is_member, # Pass this to template to show/hide join/leave buttons
    }
    return render(request, 'group_detail.html', context)


@login_required
def join_group(request, group_id): # Corrected: Parameter is group_id
    """
    Allows a user to join a public group.
    """
    group = get_object_or_404(SavingsGroup, pk=group_id) # Use group_id for lookup

    if request.method == 'POST':
        if GroupMembership.objects.filter(user=request.user, group=group).exists():
            messages.info(request, f'You are already a member of "{group.name}".')
        elif group.is_private:
            messages.error(f'"{group.name}" is a private group and cannot be joined directly.')
        else:
            GroupMembership.objects.create(user=request.user, group=group)
            messages.success(f'You have successfully joined "{group.name}"!')
        return redirect(reverse('group_detail_view', kwargs={'group_id': group.pk})) # Corrected: group_id in kwargs
    else:
        return redirect(reverse('group_detail_view', kwargs={'group_id': group.pk})) # Corrected: group_id in kwargs


@login_required
def leave_group(request, group_id): # Corrected: Parameter is group_id
    """
    Allows a user to leave a group.
    """
    group = get_object_or_404(SavingsGroup, pk=group_id) # Use group_id for lookup

    if request.method == 'POST':
        try:
            membership = GroupMembership.objects.get(user=request.user, group=group)
            # Prevent the last admin from leaving if they are the only one
            if membership.is_admin and GroupMembership.objects.filter(group=group, is_admin=True).count() == 1:
                messages.error("As the only admin, you cannot leave the group directly. Please transfer admin rights or delete the group.")
                return redirect(reverse('group_detail_view', kwargs={'group_id': group.pk})) # Corrected: group_id in kwargs
            else:
                membership.delete()
                messages.success(f'You have successfully left "{group.name}".')
                return redirect(reverse('group_list_view')) # Correct: No kwargs here
        except GroupMembership.DoesNotExist:
            messages.info(f'You are not a member of "{group.name}".')
            return redirect(reverse('group_detail_view', kwargs={'group_id': group.pk})) # Corrected: group_id in kwargs
    else:
        return redirect(reverse('group_detail_view', kwargs={'group_id': group.pk})) # Corrected: group_id in kwargs

# Add views for accepting/declining invitations, contributing to groups, etc.
# These would be new views as needed based on your application's features.

@login_required
def process_contribution(request):
    """
    Handles contributions to a savings group.
    """
    if request.method == 'POST':
        group_id = request.POST.get('group_id')
        amount_str = request.POST.get('amount')
        payment_method = request.POST.get('payment_method')

        group = get_object_or_404(SavingsGroup, pk=group_id)
        user_wallet = get_object_or_404(Wallet, user=request.user)

        try:
            amount = Decimal(amount_str)
            if amount <= 0:
                messages.error("Contribution amount must be positive.")
                return redirect(reverse('group_detail_view', kwargs={'group_id': group.pk})) # Redirect to detail view
        except ValueError:
            messages.error("Invalid amount provided.")
            return redirect(reverse('group_detail_view', kwargs={'group_id': group.pk})) # Redirect to detail view

        # Check if the user is a member of the group
        if not GroupMembership.objects.filter(user=request.user, group=group).exists():
            messages.error("You are not a member of this group.")
            return redirect(reverse('group_list_view'))

        with db_transaction.atomic():
            if payment_method == 'wallet':
                if user_wallet.balance >= amount:
                    user_wallet.withdraw(amount) # Deduct from wallet
                    Transaction.objects.create(
                        wallet=user_wallet,
                        group=group, # Link transaction to the group
                        amount=amount,
                        transaction_type='contribution',
                        status='completed',
                        description=f"Contribution to {group.name} from wallet"
                    )
                    messages.success(f"Successfully contributed ₦{amount:,.2f} to {group.name}.")
                else:
                    messages.error("Insufficient wallet balance for this contribution.")
            elif payment_method == 'bank' or payment_method == 'card':
                # In a real application, this would integrate with a payment gateway (e.g., Paystack, Flutterwave)
                # For now, we'll simulate a pending transaction.
                Transaction.objects.create(
                    wallet=user_wallet,
                    group=group,
                    amount=amount,
                    transaction_type='contribution',
                    status='pending', # Will be 'completed' after payment gateway callback
                    description=f"Pending contribution to {group.name} via {payment_method}"
                )
                messages.info(f"Contribution of ₦{amount:,.2f} to {group.name} initiated via {payment_method}. Complete the payment on the next screen.")
                # Redirect to a payment gateway URL or a page confirming payment initiation
                # For now, redirect back to group list
            else:
                messages.error("Invalid payment method selected.")
                return redirect(reverse('group_detail_view', kwargs={'group_id': group.pk})) # Redirect to detail view

        return redirect(reverse('group_detail_view', kwargs={'group_id': group.pk})) # Redirect to group detail after contribution
    else:
        messages.error("Invalid request method for contribution.")
        return redirect(reverse('group_list_view'))