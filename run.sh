

gunicorn app:app -b 0.0.0.0:1995 -w 2 -D -p gunicorn.pid --error-logfile gunicorn.run.log --access-logfile gunicorn.run.log  --access-logformat "%(r)s %(U)s %(a)s" --name "zhui_test"
