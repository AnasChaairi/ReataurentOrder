from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('odoo_integration', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Restaurant',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=200)),
                ('slug', models.SlugField(blank=True, max_length=220, unique=True)),
                ('address', models.TextField(blank=True)),
                ('phone', models.CharField(blank=True, max_length=30)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('odoo_config', models.OneToOneField(blank=True, help_text='Odoo POS configuration for this restaurant', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='restaurant', to='odoo_integration.odooconfig')),
                ('owner', models.ForeignKey(blank=True, help_text='Restaurant owner account', limit_choices_to={'role': 'RESTAURANT_OWNER'}, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='owned_restaurants', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Restaurant',
                'verbose_name_plural': 'Restaurants',
                'ordering': ['name'],
            },
        ),
    ]
