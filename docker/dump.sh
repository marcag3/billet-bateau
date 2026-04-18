#!/bin/bash
#https://github.com/xcad2k/scripts/blob/main/db-container-backup/db-container-backup.sh
DAYS=2
SCRIPT_DIR=$(cd $(dirname "${BASH_SOURCE[0]}") && pwd)
BACKUPDIR=$SCRIPT_DIR/../duplicati/dumps
source $SCRIPT_DIR/.env


if [ ! -d $BACKUPDIR ]; then
    mkdir -p $BACKUPDIR
fi

nice -n 0 ionice -c2 -n 0 mysqldump --no-tablespaces -u $DB_USERNAME -p$DB_PASSWORD $DB_DATABASE | gzip > $BACKUPDIR/backup-$DB_DATABASE-$(date +"%Y%m%d%H%M").sql.gz

OLD_BACKUPS=$(ls -1 $BACKUPDIR/$i*.gz |wc -l)
if [ $OLD_BACKUPS -gt $DAYS ]; then
    find $BACKUPDIR -name "backup*.gz" -daystart -mtime +$DAYS -delete
fi
echo `date` database dump done
