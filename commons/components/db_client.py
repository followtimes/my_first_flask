#-*- coding:utf-8 -*-

import time

import commands
import datetime

import MySQLdb
from MySQLdb import IntegrityError, OperationalError, InternalError

from commons.heng_logger import db_log as log
from commons.utils.email import Email
from commons.components.errors import DbError
from configs import config

class DB(object):
    """默认走主库, 已主库为基础
    """

    #只用申明一次的全局变量
    _instance = None
    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            cls._instance = super(DB, cls).__new__(
                                cls, *args, **kwargs)
        return cls._instance

    def __init__(self, config_):
        self.config = config_
        self._conn = None
        self.host = self.config.MASTER_DB_HOST

    def connect(self, host=None, user=None, passwd=None):
        if not host:
            host = self.host
        if not user:
            user=self.config.MASTER_DB_USER
        if not passwd:
            passwd=self.config.MASTER_DB_PASSWD
        try:
            log.info("conneting [host:%s][user:%s]" % (host, user))
            self._conn and self._conn.close()
            self._conn = MySQLdb.connect(
                host=host,
                port=self.config.DB_PORT,
                user=user,
                passwd=passwd,
                db=self.config.DB_NAME,
                use_unicode=True,
                connect_timeout=5,
                charset="utf8")
            self._conn.autocommit(True)
            log.info("conneted [host:%s][user:%s]" % (host, user))
        except Exception, e:
            log.error("Fatal: connect db fail:%s" % e)
            self._conn = None
            Email.send_to_maintainers('数据库%s链接异常' % host, str(e))
        return self._conn

    def retry(self, *a, **kw):
        """对sql语句进行重试
        主库重试4次, 每次sleep的2<<i(s)
        """
        cursor = None
        cnt = 0
        while cnt < config.MASTER_DB_HOST_MAX_RETRY_TIMES:
            log.info("begin retry: %s" % cnt)
            time.sleep(2*cnt) #sleep 
            log.info("sleep %s end" % 2*cnt)
            cnt += 1
            try:
                self.connect()
                if not self._conn:
                    continue
                cursor = self._conn.cursor()
                cursor.execute(*a, **kw)
                break
            except (OperationalError, InternalError) as e:
                log.error("Fatal: reconnect db fail:%s" % e)
        if cnt >= config.DB_RETRY_COUNT_MAIL:
            msg = '数据库%s链接重试%s次' % (self.host, cnt)
            Email.send_to_maintainers(msg, msg)
        log.info("end retried: %s times" % cnt)

        # 主库降级
        if not cursor:
            self.connect(host=config.DOWNGRADED_MASTER_DB_HOST)
            if self._conn:
                cursor = self._conn.cursor()
                cursor.execute(*a, **kw)

        if cursor == None:
            raise DbError("db connection error")
        return cursor

    def execute(self, *a, **kw):
        cursor = None
        try:
            if not self._conn:
                cursor = self.retry(*a, **kw)
            else:
                cursor = self._conn.cursor()
                cursor.execute(*a, **kw)
        except (OperationalError, InternalError) as e:
            log.error("begin retry:%s" % e)
            cursor = self.retry(*a, **kw)

        return cursor

    def query_all(self, *a, **kw):
        cursor = self.execute(*a, **kw)
        ret = cursor.fetchall()
        cursor and cursor.close()
        return ret

    def close(self):
        if self._conn:
            try:
                cursor = self._conn.cursor()
                if cursor:
                    cursor.close()
            except Exception,e:
                log.debug('close cursor failed')


class MasterDB(DB):

    def insert(self, *a, **kw):
        cursor = self.execute(*a, **kw)
        id_ = cursor.lastrowid
        cursor and cursor.close()
        return id_

    def update(self, *a, **kw):
        cursor = self.execute(*a, **kw)
        ret = cursor.rowcount
        cursor and cursor.close()
        return ret

    def delete(self, *a, **kw):
        cursor = self.execute(*a, **kw)
        ret = cursor.rowcount
        cursor and cursor.close()
        return ret

class ReadDB(DB):
    def prepare(self):
        self.hosts = []
        read_db_hosts = filter(None, self.config.READ_DB_HOSTS.split(";")) #以;分割
        if len(read_db_hosts) == 0 :
            raise DbError("READ_DB_HOSTS is empyt")

        valid_db_hosts = {}
        hosts = []
        for db_host in read_db_hosts:
            cmd = "ping -W 2 -c 2 %s" % db_host
            log.info(cmd)
            try:
                ping_result = [line.rpartition('=')[-1].replace(" ms", "") for line in commands.getoutput(cmd).splitlines()[1:-4]]
                if not ping_result:
                    #如果ping失败，发送邮件
                    title = "db[%s] ping is empty" % db_host
                    msg = "%s\n%s" % (title, cmd)
                    log.error(msg)
                    Email.send_to_maintainers(title, msg)

                #ping正常，获取最小的链接
                tmp_list = [ float(t) for t in ping_result]
                valid_db_hosts[min(tmp_list)] = db_host #如果time相同，Host可能被覆盖。理论上时间是不会相同的
            except Exception, e:
                title = "db[%s] prepare is error" % db_host
                msg = "%s\n%s" % (title, cmd)
                log.error(msg)
                Email.send_to_maintainers(title, msg)

        if not valid_db_hosts:
            title = "db[%s] prepare is error" % db_host
            msg = "%s\n%s" % (title, cmd)
            log.error(msg)
            Email.send_to_maintainers(title, msg)
            raise DbError("READ_DB_HOSTS is error. no host to reach")
        else:
            times = sorted(valid_db_hosts.keys()) #默认以从小到大得排序
            for t in times:
                hosts.append(valid_db_hosts[t])
        self.hosts = hosts # 有效的机器列表

    def __init__(self, config_):
        self.config = config_
        self.hosts = [] # 有效的db机器列表
        self.prepare()
        DB.__init__(self, config_)

    def retry(self, *a, **kw):
        """对sql语句进行重试
        从库重试2次，若失败后自动换下一个DB
        """
        cnt = 0
        error_msg = ""
        user = self.config.READ_DB_USER
        passwd = self.config.READ_DB_PASSWD
        cursor = None
        for h in self.hosts:
            cnt += 1
            try:
                self.connect(host=h, user=user, passwd=passwd)
                if not self._conn:
                    error_msg += "%s connect error" % h
                    continue
                cursor = self._conn.cursor()
                cursor.execute(*a, **kw)
                break
            except (OperationalError, InternalError) as e:
                log.error("Fatal: reconnect db fail:%s" % e)
            finally:
                if cnt >= config.DB_RETRY_COUNT_MAIL:
                    msg = '数据库从库重试%s次' % (cnt)
                    Email.send_to_maintainers(msg, error_msg)
        return cursor


class MixDB():
    """抽象数据库操作，封装主从分离，对上层业务透明
    """

    def __init__(self):
        self.db_conn = MasterDB(config)
        self.read_db_conn = ReadDB(config)

    def insert(self, *a, **kw):
        return self.db_conn.insert(*a, **kw)

    def update(self, *a, **kw):
        return self.db_conn.update(*a, **kw)

    def delete(self, *a, **kw):
        return self.db_conn.delete(*a, **kw)

    def query_all(self, *a, **kw):
        """只走从库
        """
        #return read_db_conn.query_all(*a, **kw)
        return self.db_conn.query_all(*a, **kw)

    def mix_query_all(self, *a, **kw):
        """默认走从库，如果未读取到结果，尝试主库
        调用此函数时需要业务进行判断
        由于有性能消耗，需要注意不能滥用

        """

        #现在由于数据库监控未添加，暂时全部走主库
        #主库开启大缓存，性能暂时还可以接受
        ret = self.db_conn.query_all(*a, **kw)
        return ret

        #ret = read_db_conn.query_all(*a, **kw)
        if not ret:
            log.info("mix_query_all[%s][%s]" % (a, kw))
            ret = self.db_conn.query_all(*a, **kw)
        return ret

    def close(self):
        self.db_conn.close()
        self.read_db_conn.close()


db_conn = MasterDB(config)
mix_db = MixDB()
