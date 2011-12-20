import MySQLdb
import ConfigParser

# Set up database
config = ConfigParser.ConfigParser()
config.read("settings.cfg")
MYSQL_SERVER = config.get("database", "MYSQL_SERVER")
MYSQL_PASSWD = config.get("database", "MYSQL_PASSWD")
MYSQL_USER = config.get("database", "MYSQL_USER")
MYSQL_DB = config.get("database", "MYSQL_DB")
MYSQL_TABLE = config.get("database", "MYSQL_TABLE")


conn = MySQLdb.connect(host = MYSQL_SERVER,
                       user = MYSQL_USER,
                       passwd = MYSQL_PASSWD,
                       db = MYSQL_DB)
query = "CREATE TABLE " + MYSQL_DB + "."+ MYSQL_TABLE + "(phoneid CHAR(25),\
        browserid CHAR(25), \
        testname CHAR(25), \
        result INT UNSIGNED,\
        blddate DATETIME NOT NULL,\
        revision VARCHAR(255),\
        bldtype CHAR(10),\
        productname CHAR(25),\
        platform CHAR(25),\
        osver CHAR(25),\
        machineID CHAR(25),\
        testtype CHAR(25),\
        runstamp DATETIME,\
        INDEX idx_date_phone__browser_test(blddate,phoneid,browserid, testname))"
c = conn.cursor()
c.execute(query) 


