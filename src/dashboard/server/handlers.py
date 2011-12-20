from collections import defaultdict
from datetime import date, datetime, timedelta
import time
from decimal import *
#from mozautoeslib import ESLib
import ConfigParser
import csv
import dateutil.parser
import re
import templeton
import templeton.handlers
import web
import MySQLdb
import pdb

try:
  import json
except:
  import simplejson as json

config = ConfigParser.ConfigParser()
config.read("settings.cfg")
ES_SERVER = config.get("database", "ES_SERVER")
#eslib = ESLib(ES_SERVER, config.get("database", "INDEX"), config.get("database", "TYPE"))
MYSQL_SERVER = config.get("database", "MYSQL_SERVER")
MYSQL_PASSWD = config.get("database", "MYSQL_PASSWD")
MYSQL_USER = config.get("database", "MYSQL_USER")
MYSQL_DB = config.get("database", "MYSQL_DB")
MYSQL_TABLE = config.get("database", "MYSQL_TABLE")

# "/api/" is automatically prepended to each of these
urls = (
 '/perfdata/?',"PerfdataHandler",
 '/xbrowserstartup/?', "CrossBrowserStartupHandler",
 '/xbrowserstartup_add/?', "CrossBrowserStartupAddResult"
)

class CrossBrowserStartupAddResult():
    @templeton.handlers.json_response
    def GET(self):
        conn = MySQLdb.connect(host = MYSQL_SERVER,
                               user = MYSQL_USER,
                               passwd = MYSQL_PASSWD,
                               db = MYSQL_DB)
        params,body = templeton.handlers.get_request_parms()

        p = json.loads(params["data"][0])
        c = conn.cursor()
        query = "INSERT INTO " + MYSQL_DB + "." + MYSQL_TABLE + " VALUES(\
                %s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)"
        blddate = datetime.fromtimestamp(float(p["testsuites"][0]["starttime"]))
        now = datetime.now()
        perfdata = p["testsuites"][0]["perfdata"][0] 
        testgroup = p["testgroup"]

        # Take the JSON we got and put it in the database
        c.execute(query, (perfdata["perfdata"][0]["phone"],
                          perfdata["perfdata"][0]["browser"],
                          perfdata["perfdata"][0]["type"],
                          perfdata["perfdata"][0]["result"],
                          blddate.strftime("%Y-%m-%d %H:%M:%S"),
                          testgroup["revision"],
                          testgroup["buildtype"],
                          testgroup["productname"],
                          testgroup["platform"],
                          testgroup["os"],
                          testgroup["machine"],
                          testgroup["harness"],
                          now.strftime("%Y-%m-%d %H:%M:%S")))

class CrossBrowserStartupHandler():
    @templeton.handlers.json_response
    def GET(self):
        conn = MySQLdb.connect(host = MYSQL_SERVER,
                               user = MYSQL_USER,
                               passwd = MYSQL_PASSWD,
                               db = MYSQL_DB)

        params,body = templeton.handlers.get_request_parms()


        testname = params["test"][0] + "-" + params["style"][0] + "-startup"

        #TODO: Optimize queries, there's a much better way to do this, not
        # thinking of it now, too tired.
        revq = "SELECT DISTINCT revision FROM " + MYSQL_DB + "." + MYSQL_TABLE
        phoneq = "SELECT DISTINCT phoneid FROM " + MYSQL_DB + "." + MYSQL_TABLE
        browserq = "SELECT DISTINCT browserid FROM " + MYSQL_DB + "." + MYSQL_TABLE
        testq =  "SELECT DISTINCT testname FROM " + MYSQL_DB + "." + MYSQL_TABLE
        resultq = "SELECT AVG(result), blddate FROM " + MYSQL_DB + "." + MYSQL_TABLE + \
" WHERE ((DATE_SUB(CURDATE(),INTERVAL " + params["date"][0] + " DAY) <= blddate) \
AND revision=%s AND phoneid=%s AND browserid=%s AND testname=%s)"

        series = []

        c = conn.cursor()
        c.execute(revq)
        revrows = c.fetchall()

        c.execute(phoneq)
        phonerows = c.fetchall()

        c.execute(browserq)
        browserrows = c.fetchall()

        c.execute(testq)
        testrows = c.fetchall()

        # TODO: Can this be cleaned up by pushing logic into db
        for rev in revrows:
            for phone in phonerows:
                for browser in browserrows:
                    phone_browser = phone[0] + "-" + browser[0]
                    # If our phone browser combo not in the series add it.
                    # If it is in the list return the index.
                    # Either way we get the index of the phone_browser
                    # combo in the list.
                    idx = self.ensure_in_series(phone_browser, series)

                    for test in testrows:
                        print resultq % (rev[0], phone[0], browser[0], test[0])
                        c.execute(resultq, (rev[0],
                                            phone[0],
                                            browser[0],
                                            test[0]))
                        resultrows = c.fetchall()

                        # If we have no data for this phone-browser test then
                        # skip it.
                        if resultrows[0][0] == None:
                            # DEBUGGING
                            print "-------------"
                            print "No data for phone-browser:%s on test %s for rev: %s" % (phone_browser, test[0], rev[0])
                            continue
                        # There is just one average for this result and bldtime  so push
                        # into our array
                        avg = int(resultrows[0][0])
                        blddate = resultrows[0][1]

                        # Stupid python can't do a totimestamp...
                        tstamp = time.strptime(blddate.strftime("%Y-%m-%d %H:%M:%S"),
                                               "%Y-%m-%d %H:%M:%S")
                        tstamp = time.mktime(tstamp)
                        # Debugging code
                        print "------------"
                        print "DATE: %s" % blddate.isoformat()
                        print "TSTAMP: %s" % tstamp
                        print "REV: %s" % rev[0]
                        print "PHONE: %s" % phone[0]
                        print "BROWSER: %s" % browser[0]
                        print "AVG %s" % avg

                        # Add our point to the series data - our tstamp is in
                        # secs since EPOC, we need it to be ms since epoc for charts,
                        # so multiply by 1000.
                        series[idx]["data"].append([tstamp * 1000, avg, phone_browser])



        retval = {"series": series}
        #print retval
        return retval

    def ensure_in_series(self, phone_browser, series):
        for i in range(len(series)):
            if series[i]['name'] == phone_browser:
                return i
        # If we don't find it, add it
        series.append({"name":phone_browser, "data":[]})
        return series.index({"name":phone_browser, "data":[]})

