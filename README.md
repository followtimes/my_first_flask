## 熟悉flask框架



### dir-map

`
root
    app.py
    run.sh
    gunicorn.conf
    gunicorn.pid
    pip_install.txt
    README.md
    -env
    -commons
        __init__.py
        heng_logger.py
    -configs
        __init__.py
        config.py
        local_config.py
    -heng
        __init__.py
        -main
            __init__.py
            heng_func.py
    -login
        __init__.py
        -view
            __init__.py
            login_main.py
    -logs
        app_acc.log
        app_err.log
        -heng
            heng_log

`

* app.py          flask入口函数
* run.sh          启动入口脚本，执行该脚本即可启动服务或者reload
* gunicorn.pid    服务为gunicorn启动，该文件存放master pid，方便reload等操作
* gunicorn.conf   为gunicorn的启动配置文件
* pip_install.txt 所需要的模块
