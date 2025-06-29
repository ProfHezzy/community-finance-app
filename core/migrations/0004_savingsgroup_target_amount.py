# Generated by Django 5.2.3 on 2025-06-18 06:32

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0003_invitation'),
    ]

    operations = [
        migrations.AddField(
            model_name='savingsgroup',
            name='target_amount',
            field=models.DecimalField(blank=True, decimal_places=2, help_text='The total target amount for the group (e.g., for Esusu or a target-based Ajo)', max_digits=12, null=True),
        ),
    ]
