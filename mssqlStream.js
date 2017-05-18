var stream = require('readable-stream');
var util = require('util');
var sql = require('mssql');
var uuid = require('uuid');

var sqlConnection = {};
var preConnectBuffer = [];
var isConnected = false;
var spName = '';

function IterateAndFindActorIds(requestPayload) {
    var BusinessObjectIds = '';
        for (var property in requestPayload) {
            if (requestPayload.hasOwnProperty(property)) {
                if (typeof requestPayload[property] == "object") {
                   BusinessObjectIds+=IterateAndFindActorIds(requestPayload[property], property);
                } else {
                   if(property === 'actorId'){
                    BusinessObjectIds+=  requestPayload[property] + ',';
                }
                }
            }
        }

        return BusinessObjectIds;
    }

function logAuditEvent(data) {
    if (!isConnected) {
        preConnectBuffer.push(data);
        return;
    }

    var request = new sql.Request(sqlConnection);    
  
    for (var key in data)
        if ((!(key === 'msg')) && (!(key === 'v')) && (!(key === 'time'))) {
            if (typeof data[key] === 'object') {
                var _value = JSON.stringify(data[key]);
            } else {
                var _value =  data[key];
            }
            request.input(key, _value);
        }

        request.execute(spName, function(err, recordset) {        
            if (err) {
                console.dir(err)
                return;
            };
        });
}

function MssqlStream(config) {
    config = config || {};
    stream.Writable.call(this, config);
    spName = config.spName;

    sqlConnection = new sql.Connection(config, function(err) {
        if (err) console.dir(err);
        else {
            isConnected = true;
            for (var i = 0; i < preConnectBuffer.length; i++)
                logAuditEvent(preConnectBuffer[i]);

            preConnectBuffer = [];
        }
    });


};

util.inherits(MssqlStream, stream.Writable);

MssqlStream.prototype._write = function(logMessage, encoding, done) {
                
                var jsonObj = JSON.parse(logMessage);       
                if(jsonObj.$meta !== undefined) 
                {
                    if(jsonObj.$meta.mtid !== undefined) {
                        if((jsonObj.$meta.mtid === 'request' || jsonObj.$meta.mtid === 'response' || jsonObj.$meta.mtid === 'error'))
                        {
                            var $meta = jsonObj.$meta;                            
                            var BusinessObjectIds = '';
                            if ($meta.mtid=== 'request'){
                                BusinessObjectIds = IterateAndFindActorIds(jsonObj);
                            }
                            var auditEvent=  {
                                                'AuditEventID':$meta.AuditEventID?$meta.AuditEventID:uuid.v1(),
                                                'EventName':$meta.method,
                                                'ActorID':($meta.auth) ? ($meta.auth.actorId):0,
                                                'SourceIP':$meta.ipAddress,
                                                'EventStatus': ($meta.mtid === 'error'?0:1),
                                                'ApplicationComponent':jsonObj.context,
                                                'FailureReason':'',
                                                'EventDate':new Date(),
                                                'HostName':jsonObj.hostname,
                                                'RequestPayload':jsonObj,
                                                'BusinessObjectIds':BusinessObjectIds
                                        };

                            logAuditEvent(auditEvent);
                        }
                    }
                }
        done();
    }


module.exports = function(config) {
    return new MssqlStream(config);
};
