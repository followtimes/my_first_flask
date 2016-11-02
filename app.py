#!/usr//bin/env python
#--*-- coding:utf-8 --*--

###
# my first pro by flask
# 2016-08-13 18:09
# followtimes
###

from flask import Flask, session, make_response
app = Flask(__name__)
app.config.from_object("configs.config")

import login
import heng

app.register_blueprint(heng.mod)
app.register_blueprint(login.mod)

@app.before_request
def before_request():
    if session:
        return session
    else:
        pass

@app.teardown_request
def after_request(excption):
    #save for db commmit
    pass

@app.errorhandler(Exception)
def handle_exc(e):
    return make_response( "server error !!! please contact admin")

@app.route('/')
def first_page():
    return "followtimes,welcome.come on !"

if __name__ == '__main__':
    SERVER_PORT = 1992
    
    try:
        SERVER_PORT = app.config['SERVER_PORT']
    except ImportError as e:
        pass

    #app.debug = True
    app.run(host='0.0.0.0', port=SERVER_PORT)

