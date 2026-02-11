from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('orders', '0001_initial'),
        ('restaurants', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='order',
            name='restaurant',
            field=models.ForeignKey(
                blank=True,
                help_text='Restaurant this order belongs to',
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='orders',
                to='restaurants.restaurant',
            ),
        ),
    ]
