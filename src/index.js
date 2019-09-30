/* jshint browser: true, esversion: 5, asi: true */
/*globals Vue, uibuilder */
// @ts-nocheck
/*
  Copyright (c) 2019 Julian Knight (Totally Information)

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/
'use strict'

/** @see https://github.com/TotallyInformation/node-red-contrib-uibuilder/wiki/Front-End-Library---available-properties-and-methods */

// eslint-disable-next-line no-unused-vars
var app1 = new Vue({
    el: '#app',
    data: {
        startMsg    : 'Vue has started, waiting for messages',
        feVersion   : '',
        counterBtn  : 0,
        inputText   : null,
        inputChkBox : false,
        socketConnectedState : false,
        serverTimeOffset     : '[unknown]',
        imgProps             : { width: 75, height: 75 },


        devices     : [],
        selectedDevice : {},
        isLoaded    : false,
        version     : {},

        msgRecvd    : '[Nothing]',
        msgsReceived: 0,
        msgCtrl     : '[Nothing]',
        msgsControl : 0,

        msgSent     : '[Nothing]',
        msgsSent    : 0,
        msgCtrlSent : '[Nothing]',
        msgsCtrlSent: 0,
    }, // --- End of data --- //
    computed: {
        hLastRcvd: function() {
            var msgRecvd = this.msgRecvd
            if (typeof msgRecvd === 'string') return 'Last Message Received = ' + msgRecvd
            else return 'Last Message Received = ' + this.syntaxHighlight(msgRecvd)
        },
        hLastSent: function() {
            var msgSent = this.msgSent
            if (typeof msgSent === 'string') return 'Last Message Sent = ' + msgSent
            else return 'Last Message Sent = ' + this.syntaxHighlight(msgSent)
        },
        hLastCtrlRcvd: function() {
            var msgCtrl = this.msgCtrl
            if (typeof msgCtrl === 'string') return 'Last Control Message Received = ' + msgCtrl
            else return 'Last Control Message Received = ' + this.syntaxHighlight(msgCtrl)
        },
        hLastCtrlSent: function() {
            var msgCtrlSent = this.msgCtrlSent
            if (typeof msgCtrlSent === 'string') return 'Last Control Message Sent = ' + msgCtrlSent
            //else return 'Last Message Sent = ' + this.callMethod('syntaxHighlight', [msgCtrlSent])
            else return 'Last Control Message Sent = ' + this.syntaxHighlight(msgCtrlSent)
        }
    }, // --- End of computed --- //
    methods: {
        emitZigateOnCommand: function(device){
            uibuilder.send( {
                'topic': "zigate_command_on",
                'payload':{
                        msgType : 0x0092,
                        data : [0x02, parseInt(device.shortAddress.substr(0,2), 16),  parseInt(device.shortAddress.substr(2,4), 16), 0x01,  parseInt(device.endpoint, 16), 0x01]
                    }
            } )
        },
        emitZigateOffCommand: function(device){
            uibuilder.send( {
                'topic': "zigate_command_off",
                'payload':{
                        msgType : 0x0092,
                        data : [0x02, parseInt(device.shortAddress.substr(0,2), 16),  parseInt(device.shortAddress.substr(2,4), 16), 0x01,  parseInt(device.endpoint, 16), 0x00]
                    }
            } )
        },
        emitZigatePermitJoinCommand : function(){
            uibuilder.send( {
                'topic': "zigate_command_permit_join",
                'payload':{
                            msgType : 0x0049,
                            data : [0xFF,0xFC,30,0x00]
                        }
            } )
            
        },
        emitZigateAutodiscoverCommand : function(device){
            uibuilder.send( {
                'topic': "zigate_autodiscover",
                'payload':{
                    "shortAddress" : device.shortAddress
                }
            } )
            
        },
        emitZigateVersionCommand : function(){
            uibuilder.send( {
                'topic': "zigate_command_version",
                'payload':{
                    msgType : 0x0010,
                    data : []
                }
            } )
            this.$bvModal.show("bv-modal-version")
            
        },
        emitRefreshDevicesCommand : function(){
            uibuilder.send( {
                'topic': "refresh_devices",
                'payload':{       }
            } )
    
        },
        editDeviceName: function(device){
            this.selectedDevice = device;
            this.$bvModal.show("bv-modal-change-name")
            
        },
        modalChangeNameOK : function(){
          uibuilder.send( {
                'topic': "db_update_name",
                'payload':{
                    shortAddress : this.selectedDevice.id,
                    name : this.selectedDevice.name
                }
            } )
            this.$bvToast.toast("Commande envoyée avec succès", {
                      title: 'Zigate Response',
                      autoHideDelay: 3000,
                      variant : "success",
                      appendToast : true,
                      solid: true
                    });
                    
            this.$bvModal.hide("bv-modal-change-name")
        },
        increment: function() {
            // Increment the count by one
            this.counterBtn = this.counterBtn + 1
            var topic = this.msgRecvd.topic || 'uibuilder/vue'
            uibuilder.send( {
                'topic': topic,
                'payload': {
                    'type': 'counterBtn',
                    'btnCount': this.counterBtn,
                    'message': this.inputText,
                    'inputChkBox': this.inputChkBox
                }
            } )
        }, // --- End of increment --- //

        // return formatted HTML version of JSON object
        syntaxHighlight: function(json) {
            json = JSON.stringify(json, undefined, 4)
            json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            json = json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
                var cls = 'number'
                if (/^"/.test(match)) {
                    if (/:$/.test(match)) {
                        cls = 'key'
                    } else {
                        cls = 'string'
                    }
                } else if (/true|false/.test(match)) {
                    cls = 'boolean'
                } else if (/null/.test(match)) {
                    cls = 'null'
                }
                return '<span class="' + cls + '">' + match + '</span>'
            })
            return json
        }, // --- End of syntaxHighlight --- //
    }, // --- End of methods --- //

    // Available hooks: init,mounted,updated,destroyed
    mounted: function(){
        //console.debug('[indexjs:Vue.mounted] app mounted - setting up uibuilder watchers')

        /** **REQUIRED** Start uibuilder comms with Node-RED @since v2.0.0-dev3
         * Pass the namespace and ioPath variables if hosting page is not in the instance root folder
         * e.g. If you get continual `uibuilderfe:ioSetup: SOCKET CONNECT ERROR` error messages.
         * e.g. uibuilder.start('/nr/uib', '/nr/uibuilder/vendor/socket.io') // change to use your paths/names
         */
        uibuilder.start()

        var vueApp = this

        // Example of retrieving data from uibuilder
        vueApp.feVersion = uibuilder.get('version')
        vueApp.emitRefreshDevicesCommand();

        /** You can use the following to help trace how messages flow back and forth.
         * You can then amend this processing to suite your requirements.
         */

        //#region ---- Trace Received Messages ---- //
        // If msg changes - msg is updated when a standard msg is received from Node-RED over Socket.IO
        // newVal relates to the attribute being listened to.
        uibuilder.onChange('msg', function(newVal){
            //console.info('[indexjs:uibuilder.onChange] msg received from Node-RED server:', newVal.payload);
            if (newVal.topic == 'zigate_devices'){
                console.log("Devices", newVal);
                var devicesToSendToVue = [];
                for (var key in newVal.payload.devices) {
                    var d = {};
                    d.type = "unknown";
                    d.id = key;
                    d.shortAddress = newVal.payload.devices[key].shortAddress;
                    d.name = newVal.payload.devices[key].name || "";
                    
                    for(var e in newVal.payload.devices[key].endpoints){
                        
                        d.endpoint = e;
                        
                        for(var c in newVal.payload.devices[key].endpoints[e].clusters){
                            if(c === "0006"){
                                d.type = "onoff";
                                d.value = newVal.payload.devices[key].endpoints[e].clusters[c]["0000"].value;
                            }
                            if(c === "0000"){
                                d.manufacturer = newVal.payload.devices[key].endpoints[e].clusters[c]["0004"].value;
                                d.model = newVal.payload.devices[key].endpoints[e].clusters[c]["0005"].value;
                            }
                        }
                    }
                    
                    
                    devicesToSendToVue.push(d);
                    //console.log(this.devices[key]);
                }
                vueApp.devices = devicesToSendToVue;
                vueApp.isLoaded = true;
            }
            if(newVal.topic == 'zigate_response'){
                console.log("Display toast", newVal);
                if(newVal.payload.status && newVal.payload.status.code !== 0){
                  vueApp.$bvToast.toast(newVal.payload.status.value, {
                      title: 'Zigate Response',
                      autoHideDelay: 3000,
                      variant : "danger",
                      appendToast : true,
                      solid: true
                    })                    
                }else if(newVal.payload.status){
                    vueApp.$bvToast.toast("Commande envoyée avec succès", {
                      title: 'Zigate Response',
                      autoHideDelay: 3000,
                      variant : "success",
                      appendToast : true,
                      solid: true
                    });
                    
                    if(newVal.payload.response !== undefined && newVal.payload.response.length == 1 && newVal.payload.response[0].code === '8010'){
                        vueApp.version = newVal.payload.response[0];
                    }
                }
            }
            vueApp.msgRecvd = newVal
        })
        
        
        //
        // MGR - comment
        //
        
        // As we receive new messages, we get an updated count as well
        /*
        uibuilder.onChange('msgsReceived', function(newVal){
            console.info('[indexjs:uibuilder.onChange] Updated count of received msgs:', newVal)
            vueApp.msgsReceived = newVal
        })

        // If we receive a control message from Node-RED, we can get the new data here - we pass it to a Vue variable
        uibuilder.onChange('ctrlMsg', function(newVal){
            //console.info('[indexjs:uibuilder.onChange:ctrlMsg] CONTROL msg received from Node-RED server:', newVal)
            vueApp.msgCtrl = newVal
        })
        // Updated count of control messages received
        uibuilder.onChange('msgsCtrl', function(newVal){
            //console.info('[indexjs:uibuilder.onChange:msgsCtrl] Updated count of received CONTROL msgs:', newVal)
            vueApp.msgsControl = newVal
        })
        //#endregion ---- End of Trace Received Messages ---- //

        //#region ---- Trace Sent Messages ---- //
        // You probably only need these to help you understand the order of processing //
        // If a message is sent back to Node-RED, we can grab a copy here if we want to
        uibuilder.onChange('sentMsg', function(newVal){
            //console.info('[indexjs:uibuilder.onChange:sentMsg] msg sent to Node-RED server:', newVal)
            vueApp.msgSent = newVal
        })
        // Updated count of sent messages
        uibuilder.onChange('msgsSent', function(newVal){
            //console.info('[indexjs:uibuilder.onChange:msgsSent] Updated count of msgs sent:', newVal)
            vueApp.msgsSent = newVal
        })

        // If we send a control message to Node-RED, we can get a copy of it here
        uibuilder.onChange('sentCtrlMsg', function(newVal){
            //console.info('[indexjs:uibuilder.onChange:sentCtrlMsg] Control message sent to Node-RED server:', newVal)
            vueApp.msgCtrlSent = newVal
        })
        // And we can get an updated count
        uibuilder.onChange('msgsSentCtrl', function(newVal){
            //console.info('[indexjs:uibuilder.onChange:msgsSentCtrl] Updated count of CONTROL msgs sent:', newVal)
            vueApp.msgsCtrlSent = newVal
        })
        //#endregion ---- End of Trace Sent Messages ---- //

        // If Socket.IO connects/disconnects, we get true/false here
        uibuilder.onChange('ioConnected', function(newVal){
            //console.info('[indexjs:uibuilder.onChange:ioConnected] Socket.IO Connection Status Changed to:', newVal)
            vueApp.socketConnectedState = newVal
        })
        // If Server Time Offset changes
        uibuilder.onChange('serverTimeOffset', function(newVal){
            //console.info('[indexjs:uibuilder.onChange:serverTimeOffset] Offset of time between the browser and the server has changed to:', newVal)
            vueApp.serverTimeOffset = newVal
        })
        */

    } // --- End of mounted hook --- //

}) // --- End of app1 --- //

// EOF