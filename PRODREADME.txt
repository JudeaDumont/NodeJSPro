

SEE STACKINSTALLREADME.txt FIRST


APACHE:
Use apache to host the static content of the web pages.

Create a symbloic link from htdocs into the webroot.

    start cmd as administrator.
    execute: mklink /D "pathToApache/htdocs" "pathToNode/webroot"

Start apache after replacing the configuration files found under the "conf" directory of apache
you can find the vhosts files under "extra"

Make sure the conf file has had appropriate replacements done for your particular environment.
look for: "PATHTOAPACHE" in httpd.conf and make sure it is set to your apache top level directory: C:\Users\user\Desktop\Apache24\

in httpd-vhosts.conf, there will be a link to the node server under the port 3000,
this may need to be changed depending on what port node is listening to (instantiated with).

start/restart apache by going to the "bin" directory in a cmd admin window and execute:
    httpd -k stop
    httpd -k uninstall
    https -k install
    https -k start

If errors occur at the install command step, make sure the conf file has had appropriate replacements done for your particular environment.
look for: "PATHTOAPACHE" and make sure it is set to your apache top level directory: C:\Users\user\Desktop\Apache24\

Start the node server "app.js" if the apache service installed and started without error.

Go to the browser and hit the location where apache is being hosted (localhost).
If there are 500 based errors, it means node is not being hit, if there are 400 based errors, apache is not being hit.

To setup redis on a separate machine than the nodejs server:

first, if necessary, stop redis within admin cmd, cd to redis-cli and command:

redis-cli shutdown

next pull the redis.windows.conf configuration file from the redisconfiguration in this project,
(or whichever appropriate configuration file).

scroll down to a "bind" directive

add your hostname to the bind directive, should look similar to this:
bind 127.0.0.1 HOSTNAME

you can get the original hostname of a windows machine by going to cmd and commanding:
hostname

scroll slightly down in the same CONF file and set protected mode to no rather than yes.

now start redis and pass it the path of the CONF file including the file name and extension

To test if the commands are hitting redis on this box from the outside, send this command while in the directory of the redis-cli executable

redis-cli -h HOSTNAME -p 6379 ping

If the command responds with PONG, everything is well.
External machines should be able to hit your host name at that port and get your local redis service.