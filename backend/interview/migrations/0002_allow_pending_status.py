from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('interview', '0001_initial'),
    ]

    operations = [
        # Alter the status column so it can hold 'Pending' (7 chars) and
        # remove any CHECK constraint that limited the allowed values.
        # We use raw SQL because the table is managed=False (external schema).
        migrations.RunSQL(
            sql=[
                "ALTER TABLE `Interview_Schedule` MODIFY status VARCHAR(20);",
            ],
            reverse_sql=migrations.RunSQL.noop,
        ),
    ]
