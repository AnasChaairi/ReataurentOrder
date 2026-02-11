from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0001_initial'),
        ('restaurants', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='user',
            name='role',
            field=models.CharField(
                choices=[
                    ('ADMIN', 'Admin'),
                    ('RESTAURANT_OWNER', 'Restaurant Owner'),
                    ('WAITER', 'Waiter'),
                    ('CUSTOMER', 'Customer'),
                ],
                default='CUSTOMER',
                max_length=20,
                verbose_name='role',
            ),
        ),
        migrations.AddField(
            model_name='user',
            name='restaurant',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='staff',
                to='restaurants.restaurant',
                verbose_name='restaurant',
            ),
        ),
    ]
