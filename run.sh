#/bin/bash

root_dir=$(pwd)

log_dir=$root_dir/logs
#防止无目录报错
mkdir -p $log_dir

#gunicorn的启动和错误日志
gun_acc_log=$log_dir/app_acc.log
gun_err_log=$log_dir/app_err.log

#gunicorn master pid 存放文件
pid_file=$root_dir/gunicorn.pid

#gunicorn conf file
gun_conf=$root_dir/gunicorn.conf


#检查gunicorn是否安装
hash gunicorn 2>&- || { echo >&2 "i require gunicorn but it's not installed. Aborting." ; exit 1; }

#check and reload 
if [ -f $pid_file  ]
then 
    echo "kill -HUP gunicorn master pid"
    kill -HUP $( cat $pid_file )    
else
    echo "no gunicorn pid file"
fi

#启动服务
echo "gunicorn -c $gun_conf app:app -D -p $pid_file --error-logfile $gun_err_log --access-logfile $gun_acc__log"
gunicorn -c $gun_conf app:app -D -p $pid_file --access-logfile $gun_acc_log --error-logfile $gun_err_log 

#显示是否启动
sleep 2
proc_name=$( cat $gun_conf  | grep proc_name | awk -F '=' '{print $2}' | awk -F "'" '{print $2}' )
ps aux | grep $proc_name
