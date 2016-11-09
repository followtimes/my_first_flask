#!/usr/bin/env python
#--*-- coding:utf-8 --*--

import logging
from logging.handlers import TimedRotatingFileHandler
import os
from configs.config import LOG_DIR, DEBUG

#设置logging的基本配置
logging.basicConfig(
        format='%(asctime)s\t%(levelname)s\t%(filename)s\t[line:%(lineno)d] [func:%(funcName)s] [msg:%(message)s]',
        datefmt="%Y-%m-%d %H:%M:%S",
        level=logging.DEBUG if DEBUG else logging.INFO
        )


#设置日志格式，以便加格式到具体日志实例
log_format = '[%(asctime)s][%(thread)d][%(levelname)s][%(filename)s][line:%(lineno)d] [func:%(funcName)s] [msg:%(message)s]'
formatter = logging.Formatter(log_format)


def get_logger(log_name, log_dir):
    if log_dir:
        log_dir = "%s/%s" %(LOG_DIR, log_dir) 
    else:
        log_dir = "%s/unkonw" %LOG_DIR

    #判断生成日志目录和文件
    if not os.path.exists(log_dir):
        os.makedirs(log_dir)

    log = logging.getLogger(log_name)
    #when 为 时间间隔类型 D为天 S 为分 H为时 D为天 W0-W6为周一到周天 midnight为每天凌晨
    #interval 为时间间隔
    #backupCount 为保留的日志文件数
    log_handle = TimedRotatingFileHandler('%s/%s' %(log_dir, log_name), when='D', interval=3, backupCount=10)

    #设置之前的日志格式到实例
    log_handle.setFormatter(formatter)

    #将回滚加入日志设置
    log.addHandler(log_handle)
    return log


heng_log = get_logger('heng_log', 'heng')
error_log = get_logger('error', 'common')
