#!/usr//bin/env python
#--*-- coding:utf-8 --*--

###
# my first pro by flask
# 2016-08-13 18:09
# followtimes
###

#print some info when debug
from commons.heng_logger import debug_log

from commons.components.errors import handle_error
from flask import Flask, session, make_response, redirect, request
app = Flask(__name__)
app.config.from_object("configs.config")

from controller import login
from controller import heng
from controller import api

app.register_blueprint(heng.mod)
app.register_blueprint(login.mod)
app.register_blueprint(api.mod)

@app.before_request
def before_request():
    if login_url():
        #为了防止未认证时循环跳转在before_request这里
        if 'username' in session and session['username'] == '__ToAuth__':
            pass
        elif 'username' not in session:
            session['username'] = '__ToAuth__'
            return redirect("/login")

@app.teardown_request
def after_request(excption):
    #save for db commmit
    pass

@app.errorhandler(Exception)
def handle_exc(e):
    return handle_error(e)

@app.route('/')
def first_page():
    return redirect("/heng")

app.secret_key = 'A0Zr98j/3yX R~XHH!jmN]LWX/,?RT'

def login_url():
    no_url_list = []
    no_url_list.append('api/')
    now_url_prefix = request.base_url.replace(request.url_root, '')
    for no_url in no_url_list:
        if now_url_prefix.find(no_url) == 0: 
            return False
    return True

if __name__ == '__main__':
    SERVER_PORT = 1992
    
    try:
        SERVER_PORT = app.config['SERVER_PORT']
    except ImportError as e:
        pass

    #app.debug = True
    app.run(host='0.0.0.0', port=SERVER_PORT)

