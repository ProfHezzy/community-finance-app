from django.conf import settings
from django.conf.urls.static import static
from django.urls import path
from . import views  # Import your views

urlpatterns = [
    # Your other URL patterns here
    path('', views.index, name='index'),  # Example URL pattern
    path('register/', views.register_view, name='register_view'),
    path('login/', views.login_view, name='login_view'), # Custom login view
    path('logout/', views.logout_view, name='logout'), # Custom logout view
    path('profile/', views.profile_view, name='profile_view'),
    path('dashboard/', views.dashboard_view, name='dashboard_view'),

    path('wallet/', views.wallet_view, name='wallet_view'),
    path('wallet/process/', views.process_wallet_action, name='process_wallet_action'),
    # You might want separate URLs for each action if they become very complex
    # path('wallet/fund/', views.fund_wallet, name='fund_wallet'),
    # path('wallet/withdraw/', views.withdraw_wallet, name='withdraw_wallet'),
    # path('wallet/transfer/', views.transfer_funds, name='transfer_funds'),
    path('add-bank-account/', views.add_bank_account, name='add_bank_account'),
    path('get-bank-accounts/', views.get_bank_accounts, name='get_bank_accounts'),

    path('groups/', views.group_list_view, name='group_list_view'),
    path('groups/create/', views.group_create_view, name='group_create_view'),
    path('groups/<int:group_id>/', views.group_detail_view, name='group_detail_view'),
    path('groups/<int:group_id>/join/', views.join_group, name='join_group'),
    path('groups/<int:group_id>/leave/', views.leave_group, name='leave_group'),

    # Contribution URL
    path('process_contribution/', views.process_contribution, name='process_contribution'),

] + static(settings.STATIC_URL, document_root=settings.STATICFILES_DIRS[0]) # Ensure STATICFILES_DIRS is not empty
