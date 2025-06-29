# Generated by Django 5.2.3 on 2025-06-18 06:25

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0002_wallet_alter_transaction_options_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='Invitation',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('recipient_email', models.EmailField(blank=True, help_text="Email address of the recipient if they don't have an account yet.", max_length=254, null=True)),
                ('status', models.CharField(choices=[('pending', 'Pending'), ('accepted', 'Accepted'), ('rejected', 'Rejected'), ('expired', 'Expired')], default='pending', max_length=10)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('expires_at', models.DateTimeField(blank=True, help_text='When this invitation link expires.', null=True)),
                ('token', models.CharField(blank=True, help_text='Unique token for accepting the invitation via a link.', max_length=64, null=True, unique=True)),
                ('group', models.ForeignKey(help_text='The group this invitation is for.', on_delete=django.db.models.deletion.CASCADE, related_name='invitations', to='core.savingsgroup')),
                ('recipient', models.ForeignKey(blank=True, help_text='The user who received this invitation (if they have an account).', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='received_invitations', to=settings.AUTH_USER_MODEL)),
                ('sender', models.ForeignKey(help_text='The user who sent this invitation.', on_delete=django.db.models.deletion.CASCADE, related_name='sent_invitations', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Group Invitation',
                'verbose_name_plural': 'Group Invitations',
                'ordering': ['-created_at'],
                'unique_together': {('recipient_email', 'group', 'status'), ('sender', 'recipient', 'group', 'status')},
            },
        ),
    ]
