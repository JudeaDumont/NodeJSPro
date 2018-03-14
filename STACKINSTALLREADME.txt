Stack Installation Manual

APACHE:
To use a windows apache server frontend that proxies requests to the node.js server

download Apache 2.4.x VC14 from here:

https://www.apachehaus.com/cgi-bin/download.plx

Extract the archive where you like

replace "Apache24/conf/httpd.conf" with "apacheconfig/httpd.conf" of this project

open "Apache24/conf/httpd.conf" after replacement

replace the line "Define SRVROOT "PATHTOAPACHE"
where PATHTOAPACHE is your path to apache including "Apache24".
Make sure you change back slashes to forward slashes if you cut and paste

replace "Apache24/conf/extra/httpd-vhosts.conf" with "apacheconfig/httpd-vhosts.conf"
copy "apacheconfig/virtual" directory to "Apache24/logs"

Open cmd in admin mode

cd to Apache24\bin

enter "httpd -k install"

you should see

"Installing the 'Apache2.4' service
The 'Apache2.4' service is successfully installed.
Testing httpd.conf....
Errors reported here must be corrected before the service can be started."

enter "httpd -k start"

REDIS:
https://github.com/MicrosoftArchive/redis/releases

Download: Redis-x64-3.2.100.msi
go through the installer
run the redis-cli application to input commands

Install Node from: https://nodejs.org/en/download/

run server/monitor.js

go to your browser and enter "localhost" in the address bar
