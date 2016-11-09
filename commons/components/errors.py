#!/usr/bin/env python
#--*-- coding:utf-8 --*--

import json

from flask import make_response

from configs.config import DEBUG
from commons.heng_logger import error_log

def handle_error(error):
    """处理异常，判断是否为内部封装异常，否则将发邮件

    前提：
        需对外部进行隔离，获取外部错误后，转化为内部错误
    Args:
        error: exception object
    """

    if isinstance(error, Error):
        ret = {'msg': error.message}
        ret_json = json.dumps(ret)
        resp = make_response(ret_json, error.http_code)
        return resp
    else:
        import sys, traceback
        exc_type, exc_value, exc_traceback = sys.exc_info()
        info = traceback.format_exception(exc_type, exc_value, exc_traceback)
        err_msg = "\n".join(info)
        error_log.error(err_msg)

        if not DEBUG:
            err_msg = u"服务器内部未知错误(%s)，请联系管理员" % error
            Email.send_to_maintainers(u"[未捕获异常]", err_msg)
        else:
            err_msg = err_msg.replace("\n", "</br>")

        ret = {'msg': err_msg}
        resp = make_response(json.dumps(ret), 500)
        return resp

class Error(Exception):
    """Base class for exceptions in this module.

    http_code 子类将继承此变量。默认为500，可以修改
    """

    http_code = 500
    message = ""

    def __init__(self, message):
        """
           
        Args:
            message: string 错误消息
        """
        self.message = message
        self.http_code = 500

class DbError(Error):
    def __init__(self, message=u"数据库错误"):
        """
           
        Args:
            message: string 错误消息
        """
        self.message = message

class UserOperateError(Error):
    def __init__(self, message=u"用户操作错误"):
        """
           
        Args:
            message: string 错误消息
        """
        self.message = message
        self.http_code = 400

class ParamError(Error):
    def __init__(self, message=u"参数错误"):
        """
           
        Args:
            message: string 错误消息
        """
        self.message = message
        self.http_code = 400

class NotFoundError(Error):
    def __init__(self, message=u"数据不存在"):
        """
           
        Args:
            message: string 错误消息
        """
        self.message = message
        self.http_code = 404

class ServerError(Error):
    def __init__(self, message=u"Internal server error"):
        """
           
        Args:
            message: string 错误消息
        """
        self.message = message

class HttpError(Error):
    def __init__(self, message=u"Http错误"):
        """
           
        Args:
            message: string 错误消息
        """
        self.message = message
