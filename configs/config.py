#--*-- coding:utf-8 --*--
import os

SERVER_PORT = 1995

#os.path.abspath(__file__) 获取当前文件的绝对目录，带文件名
#os.path.dirname() 获取目录路径，用一次拿到configs目录，在用一次拿到服务的跟路径
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOG_DIR = "%s/logs" %ROOT_DIR

DEBUG = False

try:
    from local_config import *
except:
    import warnings
    warnings.warn("no local config")





