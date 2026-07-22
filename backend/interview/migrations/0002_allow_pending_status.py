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
                # Widen the column just in case (already 20 chars in our model)
                "ALTER TABLE \"Interview_Schedule\" ALTER COLUMN status TYPE VARCHAR(20);",
                # Drop any existing check constraint on status
                # (PostgreSQL auto-names it <table>_status_check)
                "ALTER TABLE \"Interview_Schedule\" DROP CONSTRAINT IF EXISTS \"Interview_Schedule_status_check\";",
            ],
            reverse_sql=[
                # Restore original constraint on rollback
                "ALTER TABLE \"Interview_Schedule\" ADD CONSTRAINT \"Interview_Schedule_status_check\" "
                "CHECK (status IN ('Scheduled','Completed','Cancelled','In Progress'));",
            ],
        ),
    ]
