/* display.js -- main display module handling all view/presentation/display logic and data bindings (but not actual data)
 *   This is the "VVM" of Vue's "MVVM" pattern (Model-View-ViewModel), i.e. everything but the Model.
 *   No data store or data/biz/app logic!
 *   This is the presentation layer only. It has to go through model.js to find real data.
 */

// REQUIRES: model.js, for all data dependencies, global namespace object "CCT", some helper functions


// -- CCT.display -- the main view root; modules contained under this root are various topical areas of the view model
CCT.display = {};
CCT.d = CCT.display;    // alias for console convenience

// IIFE to act as module


// --- Clock/systime display module ---
CCT.display.clock = (function () {
    var exportObj = {};

    // To be called at very end of HTML page, after all DOM elements have been created but before page is "loaded"
    exportObj.initVue = function () {
        this.vm = new Vue({
            el: '#systemTimePanel',
            data: CCT.model.clock,  // contains hh:mm:ss etc. substrings from CCT's sysTime and siteTime
            computed: {
                sysTimeLeader: function () {
                    return this.sysTime.ddd ? `${this.sysTime.ddd} / ${this.sysTime.hh}:${this.sysTime.mm}:` : ''   // NB: ends with colon
                },
                sysTimeString: function () {
                    return this.sysTimeLeader ? `${this.sysTimeLeader}${this.sysTime.ss}` : ''
                },
                secOfDayString: function () {
                    return `${this.sysTime.secOfDay}`
                },
            },
        });
    };

    CCT.tools.callFromFinalPageElt(() => exportObj.initVue());  // call through obj to generate 'this'
    return exportObj;
})();


// NOT A VUE APP...
// Instead of a giant Vue app (spanning the entire main slide!) just to set this one class,
// we'll provide functions for the config app to call from a watched property.
CCT.display.slideMain = (function () {
    return {
        elt: undefined,
        getElt: function () {
            return this.elt || (this.elt = document.getElementById('slide-main'))
        },
        openClose: function (open) {
            if (open === undefined) {
                this.getElt().classList.toggle('closed');
            }
            else if (open) {
                this.getElt().classList.remove('closed');
            }
            else {
                this.getElt().classList.add('closed');
            }
        },
        isOpen: function () {
            return !this.getElt().classList.contains('closed');
        },
    };
})();


// --- Config panel display module ---

CCT.display.config = (function () {
    var exportObj = {};

    exportObj.initVue = function () {
        exportObj.vm = new Vue({
            el: '#config-panel',
            data: {
                config: CCT.model.config.configProperties,
                update: CCT.model.updateMsg.updateMsgProperties,
                status: CCT.model.status.statusProperties,
                updateErr: CCT.model.updateMsg.cctError,
                network: CCT.model.network,
                detailsOpen: false,
            },
            methods: {
                openCloseDetails: function (open) {
                    this.detailsOpen = (open === undefined ? !this.detailsOpen : open)
                },
            },
            computed: {
                slideOpen: function () {
                    return CCT.model.inSession() // inputs are config & update msg, included in .data above
                },
                detailsClass: function () {
                    return !this.detailsOpen ? 'closed-details' : ''
                },
                siteText: function () {
                    return this.config.site
                        ? `${this.config.site} @ ${CCT.tools.latLongText(this.config.latitude, this.config.longitude, ',')} - Vehicle ${this.status.vehicle}`
                        : '(no active configuration)'
                },
                schematicClasses: function () {
                    return {
                        stale: this.updateErr.catastrophic(),
                        signalFlowing: this.network.signalFlowing,
                    };
                },
                // Property sets for the child devices
                srcDeviceProps: function () {
                    return {
                        idName: 'src-device',
                        displayName: this.update.cmd_src || '(no src)',
                        deviceObj: this.network.sourceDevice,
                    }
                },
                primaryDeviceProps: function () {
                    return {
                        idName: 'primary-device',
                        displayName: 'Primary ' + this.update.cmd_dst,
                        deviceObj: this.network.primaryDevice,
                    }
                },
                secondaryDeviceProps: function () {
                    return {
                        idName: 'secondary-device',
                        displayName: 'Secondary ' + this.update.cmd_dst,
                        deviceObj: this.network.secondaryDevice,
                    }
                },
                // Property sets for child config-detail blocks
                ccsInfoProps: function () {
                    return {
                        title: 'CCS Info',
                        rows: [
                            [{Site: this.config.site}, {Vehicle: this.status.vehicle}],
                        ],
                    }
                },
                boxStatusProps: function () {
                    return {
                        title: 'Box Status',
                        rows: [
                            [{Mode: '(icon)'}, {Online: '(icon)'}, {Tracking: '(icon)'}],
                        ],
                    }
                },
                cmdPathProps: function () {
                    return {
                        title: 'Cmd Path',
                        rows: [
                            [{Source: this.update.cmd_src}],
                            [{Destination: this.update.cmd_dst}],
                            [{Echo: this.update.cmd_echo}],
                        ],
                    }
                },
                miscProps: function () {
                    return {
                        title: 'misc',
                        rows: [
                            [{'Client(s)': this.update.clients}],
                            [{'Config Edit': function(){
                                    CCT.display.iniFile.showHide();
                                }}, {'New Log': function(){
                                    alert("Listen!");
                                }}],
                        ]
                    }
                },
            },
            watch: {
                slideOpen: function () {
                    // this lets us avoid creating a parent Vue app in #slide-main
                    CCT.display.slideMain.openClose(this.slideOpen);
                },
            },
            components: {
                commDevice: {
                    props: ['idName', 'displayName', 'deviceObj'],
                    computed: {
                        role: function () {
                            return this.deviceObj.type === 'source' ? 'source' : this.deviceObj.opsAlt
                        },
                        connectionImg: function () {
                            return this.deviceObj.connection === 'connected' ? 'img/Connected.svg#Connected' : 'img/NotConnected.svg#NotConnected';
                        },
                        connectionClass: function () {
                            return this.deviceObj.connection === 'failed' ? 'conn-failed' : '';
                        },
                        powerImg: function () {
                            return 'img/POWunselected.png';
                        },
                        sentState: function () {
                            return this.deviceObj.trafficSent.status;
                        },
                        rcvdState: function () {
                            return this.deviceObj.trafficRcvd.status;
                        },
                        trafficSent: function () {
                            // the latest running total of traffic, not just the new amount
                            // new traffic --> this value increases --> Vue notices the change
                            return this.deviceObj.trafficSent.base.value || 0;
                        },
                        trafficRcvd: function () {
                            return this.deviceObj.trafficRcvd.base.value || 0;
                        },
                        hideIfSrc: function () {    // source does not have a rcvd channel
                            return this.deviceObj.type === 'source' ? 'visibility:hidden' : ''
                        },
                    },
                    template: `<div :id="idName + '-matte'" class="comm-device" :class="role">
                                <div :id="idName + '-panel2'" class="titled">
                                    <h1><span>{{displayName}}</span></h1>
                                    <traffic-arrow direction="right" :state="sentState" :traffic="trafficSent"></traffic-arrow>
                                    <svg :class="connectionClass" class="connection-svg">
                                        <use :href="connectionImg"></use>
                                    </svg>
                                    <traffic-arrow direction="left" :state="rcvdState" :traffic="trafficRcvd" :style="hideIfSrc" ></traffic-arrow>
                                    <img v-if="false" :src="powerImg" class="power" />
                                </div>
                              </div>`,
                    components: {
                        trafficArrow: {
                            props: ['direction', 'state', 'traffic'],
                            // direction: left | right
                            // state: inactive | new-traffic | waiting | warning | error
                            // traffic: running total of traffic, increases when we have new
                            data: function () {
                                return {
                                    trafficPrior: 0
                                }
                            },
                            computed: {
                                imgPath: function () {
                                    return `img/traffic-${this.direction}${this.state === "error" ? "-error" : ""}.png`
                                },
                                classes: function () {
                                    let cl = this.state;
                                    if (this.traffic < this.trafficPrior) {
                                        // traffic doesn't go backward; this means incoming traffic count was reset
                                        this.trafficPrior = this.traffic;   // restart count to match incoming
                                    }
                                    else if (this.traffic > this.trafficPrior) {
                                        cl += ' blink';
                                        const BLINK_INTERVAL_MS = 150; // ms to blink bright
                                        setTimeout(() => {
                                            this.trafficPrior = this.traffic
                                        }, BLINK_INTERVAL_MS);
                                    }
                                    return cl;
                                },
                            },
                            template: '<img :src="imgPath" :class="classes" class="traffic-arrow" />',
                        },
                    },
                },
                configDetail: {
                    props: ['title', 'text', 'rows'],
                    template: `<div class="panel2 titled fade-border">
                                   <h1><span>{{title}}</span></h1>
                                   <table>
                                       <detail-row v-for="row in rows" :cells="row" :key="title"></detail-row>
                                       <tr v-if="text" class="text"><td colspan="6">{{text}}</td></tr>
                                   </table>
                               </div>`,
                    components: {
                        detailRow: {
                            props: ['cells'],
                            // cells: [{key1: value1}, {key2: value2}, {key3: value3}]... up to 3 cells
                            template: `<tr :class="trClass">
                                            <td v-for="cell in cellArrays" :colspan="colspan" :key="cell[0]">
                                            <template v-if="typeof cell[1] !== 'function'">
                                                {{cell[0]}}: <span>{{cell[1]}}</span>
                                            </template>
                                            <template v-else>
                                                <button type="button" @click="cell[1]">{{cell[0]}}</button>
                                            </template>
                                            </td>
                                        </tr>`,
                            computed: {
                                cellArrays: function () {
                                    // turn the "cells" array of cell objects into an array of [key,value] arrays:
                                    // [{a:1}, {b:2}, {c:3}] --> [['a',1], ['b',2], ['c',3]]
                                    // assume each cell obj has only one property; ignore any others
                                    // supply '---' in place of empty string values, prevents border around empty value from collapsing
                                    return this.cells ? this.cells.slice(0,3).map((cell) => {
                                        let entry = Object.entries(cell)[0];
                                        if (entry[1] === '') entry[1] = '---';
                                        return entry;
                                    }) : [];
                                },
                                colspan: function () {
                                    return 6 / (this.cellArrays.length || 1);   // length is 0 to 3
                                },
                                trClass: function () {
                                    return `cols${this.cellArrays.length}`; // cols3 | cols2 | cols1 | cols0
                                },
                            },
                        },
                    },
                },
            },
        });
    };

    CCT.tools.callFromFinalPageElt(exportObj.initVue);
    return exportObj;
})();


// --- Gauges display module ---

CCT.display.gauges = (function () {
    var exportObj = {};
    var vm;
    const SVG_USER_COORDS = 140,  // internal drawing space of each gauge's svg object, not actual screen pixels
        ARC_RADIUS = 50,   // in svg user coords
        FULL_ARC_LENGTH = 2 * Math.PI * ARC_RADIUS; // length of the indicator arc for a full-scale value = circumference of gauge
    exportObj.initVue = function () {

        vm = new Vue({
            el:'#gauges',
            data:{
              updateModel: CCT.model.updateMsg.updateMsgProperties,
              statusModel: CCT.model.status.statusProperties,
            },
            computed:{
                clientsPropObj: function(){
                    return {
                        min: 0,
                        max: 12,
                        value: this.updateModel.clients,
                        label: 'Clients',
                        id: "clients-gauge",
                    };
                },
                taskStatusPropObj: function(){
                    const status = this.updateModel.taskstatus;
                    return {
                        value: status,
                        label: 'TaskStatus',
                        id: 'task-status-gauge',
                        svg: status === 'RUNNING' ? 'img/running.svg#Layer_1'
                            : status === 'FAILED' ? 'img/failed.svg#Layer_1'
                                : 'img/idle.svg#Layer_1',
                        classes: status === 'RUNNING' ? 'running' : status === 'FAILED' ? 'failed' : ''
                    }
                },
                sabPropObj: function() {
                    return {
                        min: 0,
                        max: 30,
                        value: this.statusModel.sab,
                        label: 'SAB',
                        id: 'sab-gauge',
                    }
                },
                xmtrDisplayString: function () {
                    const xmtr = this.statusModel.xmtr;
                    return xmtr === 'ANTENNA' ? 'ACTIVE' : xmtr === 'DUMMYLOAD' ? 'PASSIVE' : xmtr
                },
                xmtrPropObj: function () {
                    return {
                        value: this.xmtrDisplayString,
                        label: 'XMTR',
                        id: 'xmtr-gauge',
                        svg: 'img/TerminalIcon.svg#Layer_1',
                        classes: this.xmtrDisplayString === 'ACTIVE' ? 'active' : this.xmtrDisplayString === '' ? 'emptyGauge' : ''
                    }
                },
                antModePropObj: function () {
                    const antmode = this.statusModel.antmode;
                    return {
                        value: antmode,
                        label: 'AntMode',
                        id: 'ant-mode-gauge',
                        svg: 'img/SiteIcon.svg#SiteIcon',
                        classes: antmode === '' ? 'emptyGauge' : ''
                    }
                },
                svCmdPropObj: function () {
                    return {
                        min: 0,
                        max: 100,
                        value: this.statusModel.sv_cmds_rcvd,
                        label: 'SvCmds',
                        id: 'sv-cmds-gauge',
                    }
                },
            },
            components:{
                'dialgauge': {
                    props: ['id', 'min', 'max', 'label', 'value'],
                    computed: {
                        idMain: function () {  // unique random id in case of blank
                            return this.id ? this.id : (CCT.tools.randInt(1000000) + '-gauge')
                        },
                        idCircle: function () { // unique random id in case of blank
                            return this.idMain + '-circle'
                        },
                        gaugeReadingStyle: function () {
                            // We are making this gauge's indicator arc out of an svg dashed stroke with only one visible dash.
                            // h ("h"idden) is the proportion (0 to 1) of full scale *NOT* lit up to display this value:
                            //   1 - (value-min)/(max-min) = (max-value)/(max-min)
                            //   because the dash offset we'll need is the amount by which to push the single dash out of view.
                            const h = (this.max - this.value) / (this.max - this.min);
                            return {
                                // offset is how much of dash to *HIDE* = h scaled to dashLength, and clamped to [0,dashLength]
                                'stroke-dashoffset': h < 0.0 ? 0.0 : h > 1.0 ? FULL_ARC_LENGTH : FULL_ARC_LENGTH * h,
                                'stroke-dasharray': FULL_ARC_LENGTH,
                                transition: 'stroke-dashoffset .25s linear',
                            }
                        },
                        classes: function(){
                            return(this.value === '' ? "emptyGauge" : "");

                        }
                    },
                    template: `
                  <div :id="idMain" :class="classes" class="dials">
                    <svg viewBox="5 5 ${SVG_USER_COORDS} ${SVG_USER_COORDS + 10}">
                      <defs>
                        <filter id="glow" x="-50%" y="-25%" width="300%" height="300%">
                          <feGaussianBlur stdDeviation="7" result="blur1">
                          </feGaussianBlur>
                          <feComposite in="SourceGraphic" in2="spec1" operator="arithmetic" k1="0" k2="1" k3="2" k4="0"></feComposite>
                        </filter>
                      </defs>
                        <circle v-bind:id="idCircle" class="gaugeReading"  r="50" cx="50%" cy="-50%" fill="none" stroke="#3369ff" stroke-width="4" v-bind:style="gaugeReadingStyle">
                        </circle>
                      <use v-bind:href="'#'+idCircle" filter="url(#glow)"></use>
                        <circle class="meter" r="50" cx="50%" cy="-50%" fill="none" stroke="#a1a1a1" stroke-width="4">
                        </circle>
                        <circle class="gaugeReading"  r="50" cx="50%" cy="-50%" fill="none" stroke="#3369ff" stroke-width="5" v-bind:style="gaugeReadingStyle">
                        </circle>
                        <text x="53%" y="45%" text-anchor="middle" stroke="white" stroke-width="0" dy=".5em" class="gauge-value">
                            {{this.value}}
                        </text>
                        <text x="53%" y="85%" text-anchor="middle" stroke="white" stroke-width="0" dy="1em" class="gauge-label">
                            {{label}}
                        </text>
                    </svg>
                  </div>
`,
                },
                'icongauge': {
                    props: ['id', 'label', 'value', 'svg', 'classes'],
                    computed: {
                        idMain: function () {  // unique random id in case of blank
                            return this.id ? this.id : (CCT.tools.randInt(1000000) + '-gauge')
                        },
                    },
                    template: `
                        <div :id="idMain" :class="classes" class="dials">
                            <svg viewBox="0 5 ${SVG_USER_COORDS} ${SVG_USER_COORDS + 10}">
                            <svg :id="idMain + '-icon'" y="10%" height="75%">
                                <use :href="svg" />
                            </svg>
                            <text x="50%" y="45%" text-anchor="middle" stroke="white" stroke-width="0" dy=".5em" class="gauge-value">
                                {{this.value}}
                            </text>
                            <text x="50%" y="85%" text-anchor="middle" stroke="white" stroke-width="0" dy="1em" class="gauge-label">
                                {{label}}
                            </text>
                            </svg>
                        </div>
                    `,
                },
            },
        });
        this.vm = vm;
    };
    CCT.tools.callFromFinalPageElt(()=>exportObj.initVue());
    return exportObj;
})();


// --- Map display module ---

CCT.display.map = (function () {
    var exportObj = {};

    exportObj.initVue = function () {
        this.vm = new Vue({
            el: '#map-area',
            data: {
                settings: CCT.model.settings,
                config: CCT.model.config.configProperties,
                status: CCT.model.status.statusProperties,
                detailsOpen: false,
                testLoc: [
                    {id: '', long: -0.0077, lat: 51.4826, name: 'Greenwich, England - the zero meridian'},
                    {id: '', long: -78.4678, lat: -0.1807, name: 'Quito, Ecuador - the equator'},
                    {id: '', long: -155.5828, lat: 19.8968, name: 'Hawaii, coastal intersection point'},
                    {id: '', long: -15.86, lat: 17.97, name: 'Nouakchott, Mauritania - Africa\'s dimple'},
                    {id: '', long: -119.4179, lat: 36.7783, name: 'California, midpoint'},
                    {id: '', long: -180, lat: 83, name: 'near NW map corner'},
                    {id: '', long: 180, lat: 83, name: 'near NE map corner'},
                    {id: '', long: 180, lat: -74, name: 'near SE map corner'},
                    {id: '', long: -180, lat: -74, name: 'near SW map corner'},
                ],
            },
            computed: {
                // <svg> uses viewBox framing just the part of the map we want to see
                svgViewBox: () => `${VIEWBOX.x} ${VIEWBOX.y} ${VIEWBOX.width} ${VIEWBOX.height}`,
                // <image> bounding box MUST match svg's FULL calibrated viewBox, to keep coordinates accurate
                imgBounds: () => FULL_VIEWBOX,
                homeLoc: function () {
                    return {
                        id: 'home',
                        name: this.settings.homeName,
                        long: this.settings.homeLong,
                        lat: this.settings.homeLat
                    }
                },
                siteLoc: function () {
                    return {id: 'site', name: this.config.site, long: this.config.longitude, lat: this.config.latitude}
                },
                siteClass: function () {
                    return this.config.site ? 'show' : ''
                },
                arcParams: function(){
                    let mpA = mercatorProjection([this.settings.homeLong,this.settings.homeLat]),
                        mpB = this.config.site ? mercatorProjection([this.config.longitude,this.config.latitude]) : [0,0];
                    return{longA: mpA[0], longB: mpB[0], latA: mpA[1], latB: mpB[1]};
                }
            },
            components: {
                'map-location': {
                    props: ['id', 'name', 'long', 'lat'],
                    data: () => ({}),
                    computed: {
                        eltId: function () {
                            return this.id ? this.id + '-loc' : ''
                        },
                        mp: function () {
                            return this.long === '' || this.lat === '' ? ['', ''] : mercatorProjection([this.long, this.lat])
                        },
                        tooltip: function () {
                            return `${this.name}\n${CCT.tools.latLongText(this.lat, this.long, 'L\nL')}`
                        },
                        radius: function () {
                            return this.id ? 3 : 1.5
                        },    // smaller radius for anonymous test points
                        url: function() {
                            return this.eltId === 'home-loc' ? "img/MapMarkerOrigin.svg#map_marker_origin" : "img/MapMarker.svg#map_marker";
                        },
                    },
                    template: `<svg :id="eltId" :x="mp[0]-6" :y="mp[1]-16" width="12px" height="16px"><use :href="url"><title>{{tooltip}}</title></use></svg>`,
                },
                'map-arc': {
                    props: ['longA', 'longB', 'latA', 'latB'],
                    data: function(){
                        // subjective values to influence the shape of the curve
                        return{
                            height: 0.3,
                            width: 0.25
                        }
                    },
                    computed: {
                        //calculate the curve based on the two locations
                        pathStringFwd: function() {
                            return "M " + this.longA + " " + this.latA +
                                " C " + this.getLong(this.height, 1 - this.width) + " " + this.getLat(this.height, 1 - this.width) + " " +
                                this.getLong(this.height, this.width) + " " + this.getLat(this.height, this.width) + " " +

                                this.longB + " " + this.latB;
                        },
                        pathStringBack: function() {
                            return "M " + this.longB + " " + this.latB +
                                " C " + this.getLong(this.height / 2, this.width) + " " + this.getLat(this.height / 2, this.width) + " " +
                                this.getLong(this.height / 2, 1 - this.width) + " " + this.getLat(this.height / 2, 1 - this.width) + " " +
                                this.longA + " " + this.latA;
                        },
                    },
                    methods: {
                        //choose control points for the Bezier curve
                      getLat: function(height,width) {
                          return ((1 - width) * this.latA) + (width * this.latB) + height * (this.longB - this.longA);
                      },
                      getLong: function(height,width) {
                          return (width * this.longA) + ((1 - width) * this.longB) + height * (this.latA - this.latB);
                      }
                    },
                    template: '<g><path class="map-arc" :d="pathStringFwd"></path><path class="map-arc reversed" :d="pathStringBack"></path></g>'
                },
            },
        });
    };


    // --- MERCATOR PROJECTION ---
    // Set up the Mercator projection's X scale to use natural longitude coords in degrees.
    //   This yields a Y scale in log/radians in which -180 to +180 corresponds to latitudes of about -85 S to +85 N.
    var mercatorProjection = d3.geoMercator()
        .scale(180 / Math.PI)    // scale = 1/2 globe width over pi radians; use longitude degrees for the globe width units
        .translate([0, 0]);     // canonical origin (d3 defaults to non-zero)

    // --- MAP CALIBRATION ---
    // We empirically found the boundaries of our map image in this coord space.
    // This is the <svg> viewBox that corresponds to a full view of the map image.
    // The map is actually wider than the whole globe, because Alaska and Russia do not overlap. Hence the left X < -180 and width > 360.
    const FULL_VIEWBOX = {
        x: -187.506854251581,
        y: -163.767139725934,
        width: 376.966229655657,
        height: 278.460843078004
    };
    // And here's the viewBox we actually want to see, yielding the aspect ratio we like
    const VIEWBOX = {
        x: -187.506854251581,
        y: -145,
        width: 376.966229655657,
        height: 215
    };


    // TODO: convert all similar initVue calls to arrow functions to preserve 'this', so this.vm can be saved properly as it is above
    CCT.tools.callFromFinalPageElt(() => exportObj.initVue());  // call through obj to generate 'this'
    return exportObj;
})();


// --- NetworkIcons display module ---

CCT.display.networkIcons = (function () {
    var networkStatus = CCT.model.network;
    var exportObj = {};

    exportObj.initVue = function () {
        this.vmSite = new Vue({
            el: '#site',
            data: networkStatus,
        });

        this.vmCCT = new Vue({
            el: '#cct',
            data: networkStatus,
        });

        this.vmSoc = new Vue({
            el: '#soc',
            data: networkStatus,
        });

        this.vmSiteToCct = new Vue({
            el: '#cct-to-site',
            data: networkStatus,
        });

        this.vmCctToSoc = new Vue({
            el: '#soc-to-cct',
            data: networkStatus,
        });
    };
    CCT.tools.callFromFinalPageElt(exportObj.initVue);
    return exportObj;
})();

CCT.display.messageDisplay = (function () {
    var bannerModel = CCT.model.banner;
    var exportObj = {};

    exportObj.initVue = function () {
        this.vmSite = new Vue({
            el: '#message-wrapper',
            data: bannerModel,
            computed: {
                bannerStyle: function () {
                    return {
                        cat4: bannerModel.cat4,
                        active: bannerModel.active || bannerModel.cat4,
                    }
                },
                showMessage: function () {
                    if (bannerModel.message !== '') {
                        CCT.tools.selectStackable(this.$el);
                        bannerModel.active = true;
                        setTimeout(function () {
                            if (!bannerModel.cat4 && bannerModel.active) {
                                bannerModel.active = false;
                            }
                        }, 3000);
                        if (bannerModel.cat4) {
                            document.getElementById('wrapper').classList.add('cat4');
                        }
                        else {
                            document.getElementById('wrapper').classList.remove('cat4');
                        }
                    }
                    return bannerModel.message;
                }
            }
        });
    };
    CCT.tools.callFromFinalPageElt(exportObj.initVue);
    return exportObj;
})();

CCT.display.monitorGraphs = (function () {
    var exportObj = {};
    const monitorSizeX = 1500, monitorSizeY = 150;
    const yLengthForinversion = monitorSizeY;
    const maxClampValue = yLengthForinversion;
    const minClampValue = 0;
    const strokeWidth = 4;

    function buildGraphPath(graph, maxLength, verticalShift, scalar, stroke) {
        let timeInterval = monitorSizeX / maxLength / 2;
        let graphPath;
        if (graph[0] !== undefined) {
            graphPath = stroke ? 'M 0 ' +
                CCT.tools.minMax((yLengthForinversion - ((+(graph[0]) + verticalShift) * scalar)), minClampValue + strokeWidth, maxClampValue - strokeWidth) + ' ' :
                'M 0 ' + (yLengthForinversion - 1) + ' ';
        }
        let i;
        for (i = 0; i < graph.length; i++) {
            if (graph[i] !== undefined) {
                if (graph[i] !== null) {
                    if (i < +graph.length - 1) {
                        if (graph[i - 1] === null) {
                            graphPath += 'M ' + i * timeInterval + ' ' +
                                CCT.tools.minMax((yLengthForinversion - ((+graph[i] + verticalShift) * scalar)), (stroke ? minClampValue + strokeWidth : minClampValue), (stroke ? maxClampValue - strokeWidth : maxClampValue));
                        }
                        graphPath += 'L ' + i * timeInterval + ' ' +
                            CCT.tools.minMax((yLengthForinversion - ((+graph[i] + verticalShift) * scalar)), (stroke ? minClampValue + strokeWidth : minClampValue), (stroke ? maxClampValue - strokeWidth : maxClampValue));
                    }
                    else {
                        graphPath += stroke ? 'M ' + i * timeInterval + ' ' +
                            CCT.tools.minMax((yLengthForinversion - ((+graph[i] + verticalShift) * scalar)), minClampValue + strokeWidth, maxClampValue - strokeWidth)
                            : 'L ' + i * timeInterval + ' ' + yLengthForinversion;
                    }
                }
                else {
                    graphPath += `M ${i * timeInterval} ${
                        CCT.tools.minMax((yLengthForinversion - ((+graph[i] + verticalShift) * scalar)), stroke ? minClampValue + strokeWidth : minClampValue, stroke ? maxClampValue - strokeWidth : maxClampValue)}`;
                }
            }
        }
        if (!stroke) {
            var j;
            for (j = 0; j < graph.length; j++) {
                if (graph[j] !== null) {
                    break;
                }
            }
            if (j !== graph.length) {
                graphPath += 'L ' + graph.length * timeInterval + ' ' + yLengthForinversion + 'L ' + j * timeInterval + ' ' + yLengthForinversion;
            }
        }
        return graphPath === undefined ? 'M 0 0' : graphPath;
    }

    exportObj.initVue = function () {
        exportObj.vm = new Vue({
            el: '#monitorsSvg',
            data: {
                networkGraph: CCT.model.networkGraph,
                antennaGraph: CCT.model.antennaGraph,
                cctError: CCT.model.updateMsg.cctError
            },
            computed: {
                getViewBoxDimensions: function () {
                    return `0 0 ${monitorSizeX} ${monitorSizeY}`;
                },
                graphInput: function () {
                    return buildGraphPath(this.networkGraph.input, this.networkGraph.getMaxLength(), 0, 12.5, false);
                },
                graphOutput: function () {
                    return buildGraphPath(this.networkGraph.output, this.networkGraph.getMaxLength(), 0, 12.5, false);
                },
                azimuthPath: function () {
                    return buildGraphPath(this.antennaGraph.azimuth, this.antennaGraph.getMaxLength(), 0, .4166666, true);
                },
                azimuthDeltaPath: function () {
                    return buildGraphPath(this.antennaGraph.azimuthDelta, this.antennaGraph.getMaxLength(), 0, .4166666, true);
                },
                elevationPath: function () {
                    return buildGraphPath(this.antennaGraph.elevation, this.antennaGraph.getMaxLength(), 0, 1.666666, true);
                },
                elevationDeltaPath: function () {
                    return buildGraphPath(this.antennaGraph.elevationDelta, this.antennaGraph.getMaxLength(), 0, 1.666666, true);
                },
                gainPath: function () {
                    return buildGraphPath(this.antennaGraph.gain, this.antennaGraph.getMaxLength(), 160, .5, true);
                },
                stalenessVisual: function () {
                    return this.cctError.catastrophic() ? 'monitorStaleVisual' : 'monitorNotStaleVisual';
                },
            },
        });
    };
    CCT.tools.callFromFinalPageElt(exportObj.initVue);
    return exportObj;
})();


// --- Log display module ---

CCT.display.log = (function () {
    var vm;
    let logRequestHandler = null;
    let logDisplayPanelElt = document.getElementById("log-display-panel");
    var exportObj = {
        initVue: function () {
            vm = new Vue({
                el: '#log-ctrl',
                data: {
                    modelLog: CCT.model.log,
                    panelStyle: {left: "", top: "", opacity: "", transform: ""},
                    panelClass: {open: false, closedX: false},
                    buttonIconClass: {open: false},
                    isVisible: false,
                },
                methods: {
                    showHide: function () {
                        if (this.panelStyle.left !== "" && this.isVisible) {
                            this.closeX();
                        }
                        else {
                            this.isVisible = !this.isVisible;
                            this.buttonIconClass.open = this.isVisible;
                            this.panelClass.open = this.isVisible;
                            this.panelClass.closedX = false;
                            CCT.tools.selectStackable(logDisplayPanelElt);
                            if (this.isVisible && logRequestHandler !== null) {
                                logRequestHandler();
                            }
                        }
                    },
                    closeX: function () {
                        this.isVisible = !this.isVisible;
                        this.buttonIconClass.open = this.isVisible;
                        this.panelClass.closedX = true;
                        return false;
                    },
                },
                directives: {
                    draggable: {
                        bind: function (el, binding, vnode) {
                            d3.select(el)
                                .call(d3.drag()
                                    .on("start", function () {
                                        CCT.tools.selectStackable(el);
                                        if (d3.event.sourceEvent.target !== el) return;
                                        vm.panelStyle.opacity = "0.5";
                                        var rect = el.getBoundingClientRect(),
                                            xBase = rect.left - d3.event.subject.x,
                                            yBase = rect.top - d3.event.subject.y,
                                            leftMax = document.documentElement.clientWidth - 12,
                                            topMax = document.documentElement.clientHeight - 12,
                                            leftMin = 12 - rect.width,
                                            topMin = 12 - rect.height;

                                        d3.event
                                            .on("drag", function () {
                                                var leftNew = d3.event.x + xBase;
                                                var topNew = d3.event.y + yBase;
                                                leftNew = CCT.tools.minMax(leftNew, leftMin, leftMax);
                                                topNew = CCT.tools.minMax(topNew, topMin, topMax);
                                                vm.panelStyle.left = leftNew + "px";
                                                vm.panelStyle.top = topNew + "px";
                                            })
                                            .on("end", function () {
                                                vm.panelStyle.opacity = "";
                                            })
                                    })
                                );
                        }
                    }
                }
            });
            this.vm = vm;
        },
        logVisible: () => vm.isVisible,
        setRequestFunction: (logRequester) => {
            logRequestHandler = logRequester;
        },
    };
    CCT.tools.callFromFinalPageElt(exportObj.initVue);
    return exportObj;
})();

// --- INI file display module ---

CCT.display.iniFile = (function () {
    var vm;
    var exportObj = {
        initVue: function () {
            vm = new Vue({
                el: '#ini-file',
                data: {
                    file: CCT.model.iniFile,
                    showing: false,
                    pendingJSON: false,
                },
                computed: {
                    viewerClass: function () {
                        return this.showing ? 'show' : ''
                    },
                    displayString: function () {
                        return this.pendingJSON ? '... getting file contents ...'
                            : this.file.contentString === undefined ? '<no INI file available>'
                                : this.file.contentString;
                    },
                },
                methods: {
                    showHide: function (show) {  // boolean, omit to toggle
                        return this.showing = (show === undefined ? !this.showing : show)
                    },
                },
            });
            this.vm = vm;
        },
        showHide: function (show, refreshOnShow=true) {   // show=boolean, omit to toggle
            if (show === undefined) {
                show = !vm.showing;
            }
            if (show && refreshOnShow) {
                vm.file.clear();
                this.getJSON();
            }
            return vm.showHide(show);
        },
        getJSON: getJSON,
    };

    const URI_INIFILE = '/api/iniFile';
    function getJSON() {
        vm.pendingJSON = true;
        return CCT.httpClient.getJSON(URI_INIFILE)
            .then(function (str) {  // str = JSON.parse(JSON.stringify(file_string))
                vm.file.update(str);
                console.log(`GOT INI FILE`);
                vm.pendingJSON = false;
            })
            .catch(function (err) {
                console.error('FAILURE in display.iniFile.getJSON: resource not available');
                vm.pendingJSON = false;
            })
    }

    CCT.tools.callFromFinalPageElt(() => exportObj.initVue());
    return exportObj;
})();
