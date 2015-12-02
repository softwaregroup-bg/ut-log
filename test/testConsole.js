var repl = require('repl').start({prompt: '> '});
var wire = require('wire');
wire({
    consoleHost: '127.0.0.1',
    consolePort: 30001,
    leveldb: {
        create: {
            module: 'levelup',
            args: ['./leveldb/logs', {db: require('leveldown')}]
        }
    },
    leveldbStream: {
        create: {
            module: 'ut-log/leveldbStream',
            args: [{$ref: 'leveldb'}]
        }
    },
    sentryStream: {
        create: {
            module: 'ut-log/sentryStream',
            args: {
                dsn: 'http://b62b47864e93466cbb16a2b4a1d749b1:05968d770cdf4f8f8f09985d95ea9911@sentry.softwaregroup-bg.com:5002/2',
                patchGlobal: false,
                logger: 'impl-test'
            }
        }
    },
    socketStream: {
        create: {
            module: 'ut-log/socketStream',
            args: {
                host: {$ref: 'consoleHost'},
                port: {$ref: 'consolePort'},
                objectMode: true
            }
        }
    },
    winston: {
        create: {
            module: 'ut-log',
            args: {
                type: 'winston',
                name: 'winston_console_test',
                streams: [
                    {
                        level: 'trace',
                        stream: {$ref: 'socketStream'},
                        type: 'raw'
                    },
                    {
                        level: 'trace',
                        stream: {$ref: 'leveldbStream'},
                        type: 'raw'
                    },
                    {
                        level: 'error',
                        stream: {$ref: 'sentryStream'},
                        type: 'raw'
                    },
                    {
                        level: 'trace',
                        type: 'process.stdout'
                    }
                ]
            }
        }
    },
    bunyan: {
        create: {
            module: 'ut-log',
            args: {
                type: 'bunyan',
                name: 'bunyan_console_test',
                streams: [
                    {
                        level: 'trace',
                        stream: {$ref: 'socketStream'},
                        type: 'raw'
                    },
                    {
                        level: 'trace',
                        stream: {$ref: 'leveldbStream'},
                        type: 'raw'
                    },
                    {
                        level: 'error',
                        stream: {$ref: 'sentryStream'},
                        type: 'raw'
                    },
                    {
                        level: 'trace',
                        stream: 'process.stdout'
                    }
                ]
            }
        }
    },
    console: {
        create: 'ut-port-console',
        properties: {
            config: {
                host: {$ref: 'consoleHost'},
                port: {$ref: 'consolePort'},
                id: 'debug_console'
            },
            db: {$ref: 'leveldb'}
        },
        init: 'init',
        ready: 'start'
    }
}, {require: require})
.then(function contextLoaded(context) {
    repl.context.w = context.winston.createLog('trace', {name: 'winston log', context: 'winston log context'});
    var b = repl.context.b = context.bunyan.createLog('trace', {name: 'bunyan log', context: 'bunyan log context'});
    repl.context.l = context.leveldb;
    setTimeout(function() {
        try {
            b.asdf();
        } catch (e) {
            b.error(e);
        }
    }, 3000);
    var test = JSON.stringify([{
        '_id': '552e5b10f3da22fcf1cc9a76',
        'index': 0,
        'guid': 'b4e5f17a-63e1-4bed-8864-5fe3dfad4c90',
        'isActive': false,
        'balance': '$3,889.10',
        'picture': 'http://placehold.it/32x32',
        'age': 30,
        'eyeColor': 'blue',
        'name': 'Reese Brock',
        'gender': 'male',
        'company': 'POLARIA',
        'email': 'reesebrock@polaria.com',
        'phone': '+1 (972) 458-3678',
        'address': '870 Dahill Road, Callaghan, Massachusetts, 9618',
        'about': 'Dolore irure ad consectetur mollit irure fugiat irure irure sunt elit nostrud. Consequat reprehenderit elit labore duis commodo aliqua consectetur deserunt excepteur laborum. Minim consectetur incididunt voluptate deserunt aute mollit culpa magna et dolor aute consequat fugiat veniam.\r\n',
        'registered': '2014-06-22T15:23:59 -03:00',
        'latitude': 87.595763,
        'longitude': -144.168731,
        'tags': [
            'labore',
            'ea',
            'culpa',
            'proident',
            'velit',
            'voluptate',
            'aliqua'
        ],
        'friends': [
            {
                'id': 0,
                'name': 'Maude Joyce'
            },
            {
                'id': 1,
                'name': 'Kris Juarez'
            },
            {
                'id': 2,
                'name': 'Lottie Ashley'
            }
        ],
        'greeting': 'Hello, Reese Brock! You have 9 unread messages.',
        'favoriteFruit': 'banana'
    }, {
        '_id': '552e5b10944ae94ff55439a6',
        'index': 1,
        'guid': '525a71e3-c1d3-4bd3-8743-bfc2a2f83d0c',
        'isActive': true,
        'balance': '$1,326.20',
        'picture': 'http://placehold.it/32x32',
        'age': 35,
        'eyeColor': 'green',
        'name': 'Shari Dale',
        'gender': 'female',
        'company': 'ZORROMOP',
        'email': 'sharidale@zorromop.com',
        'phone': '+1 (972) 501-2497',
        'address': '823 Pooles Lane, Breinigsville, New York, 3372',
        'about': 'Excepteur sunt pariatur dolor sint aute. Elit enim amet in sit. Cillum cillum eiusmod excepteur culpa et aliqua fugiat id est excepteur eu est. Culpa laborum anim eu fugiat laborum tempor in pariatur eiusmod.\r\n',
        'registered': '2014-11-10T05:50:18 -02:00',
        'latitude': 1.303693,
        'longitude': 31.84949,
        'tags': [
            'dolore',
            'incididunt',
            'duis',
            'quis',
            'elit',
            'mollit',
            'non'
        ],
        'friends': [
            {
                'id': 0,
                'name': 'Hooper Mathews'
            },
            {
                'id': 1,
                'name': 'Clements Poole'
            },
            {
                'id': 2,
                'name': 'Carolyn Watkins'
            }
        ],
        'greeting': 'Hello, Shari Dale! You have 6 unread messages.',
        'favoriteFruit': 'banana'
    }, {
        '_id': '552e5b1065ac0146bfc55429',
        'index': 2,
        'guid': 'a7c361e9-74e1-4e29-b27c-8baffb72c6f6',
        'isActive': false,
        'balance': '$2,603.56',
        'picture': 'http://placehold.it/32x32',
        'age': 28,
        'eyeColor': 'brown',
        'name': 'Bonnie Walls',
        'gender': 'female',
        'company': 'TASMANIA',
        'email': 'bonniewalls@tasmania.com',
        'phone': '+1 (907) 525-2676',
        'address': '834 Green Street, Forestburg, Florida, 5957',
        'about': 'Deserunt dolore consequat mollit consectetur. Reprehenderit cupidatat officia mollit cillum. Ipsum ut minim do deserunt velit magna magna proident elit duis velit. Consectetur anim eiusmod aliqua quis culpa duis sunt. Exercitation sit exercitation sint amet dolore do sit commodo est aliquip consequat sint.\r\n',
        'registered': '2015-03-19T12:07:44 -02:00',
        'latitude': -4.824575,
        'longitude': 136.973469,
        'tags': [
            'consectetur',
            'commodo',
            'cillum',
            'esse',
            'aliquip',
            'velit',
            'sunt'
        ],
        'friends': [
            {
                'id': 0,
                'name': 'Justine Schmidt'
            },
            {
                'id': 1,
                'name': 'Stevens Dunn'
            },
            {
                'id': 2,
                'name': 'Barnes Holt'
            }
        ],
        'greeting': 'Hello, Bonnie Walls! You have 1 unread messages.',
        'favoriteFruit': 'banana'
    }, {
        '_id': '552e5b10f5277f3ca46d29c6',
        'index': 3,
        'guid': '2da84fa5-0c1c-4de1-b425-cd0706447221',
        'isActive': true,
        'balance': '$2,218.02',
        'picture': 'http://placehold.it/32x32',
        'age': 31,
        'eyeColor': 'brown',
        'name': 'Herman Kelly',
        'gender': 'male',
        'company': 'OVIUM',
        'email': 'hermankelly@ovium.com',
        'phone': '+1 (956) 470-2254',
        'address': '650 Glen Street, Osage, Washington, 9324',
        'about': 'Enim ullamco reprehenderit incididunt ipsum aliquip veniam minim officia. Ea consectetur irure veniam amet esse dolor id labore cillum pariatur et proident culpa. Amet sunt reprehenderit quis veniam anim fugiat.\r\n',
        'registered': '2014-05-14T08:01:48 -03:00',
        'latitude': 11.613054,
        'longitude': -83.376907,
        'tags': [
            'consequat',
            'velit',
            'cillum',
            'officia',
            'duis',
            'Lorem',
            'veniam'
        ],
        'friends': [
            {
                'id': 0,
                'name': 'Mcdonald Larsen'
            },
            {
                'id': 1,
                'name': 'Cummings Woodard'
            },
            {
                'id': 2,
                'name': 'Rowland Barker'
            }
        ],
        'greeting': 'Hello, Herman Kelly! You have 4 unread messages.',
        'favoriteFruit': 'banana'
    }, {
        '_id': '552e5b1071e8ffba6126d059',
        'index': 4,
        'guid': 'dcff1d35-cfce-48cd-8b74-449aaf6f879a',
        'isActive': true,
        'balance': '$3,225.50',
        'picture': 'http://placehold.it/32x32',
        'age': 23,
        'eyeColor': 'brown',
        'name': 'Brittany Ford',
        'gender': 'female',
        'company': 'ZIALACTIC',
        'email': 'brittanyford@zialactic.com',
        'phone': '+1 (941) 574-2744',
        'address': '138 Nixon Court, Yonah, Federated States Of Micronesia, 9990',
        'about': 'Pariatur pariatur eu incididunt labore et amet amet cillum deserunt irure in ipsum. Non nulla ut nostrud elit eiusmod aliqua labore laboris nostrud et commodo. Cillum dolore enim velit ullamco reprehenderit enim incididunt consequat esse eu. Eu exercitation nulla laboris non.\r\n',
        'registered': '2014-02-08T16:19:44 -02:00',
        'latitude': -41.664015,
        'longitude': 4.842155,
        'tags': [
            'excepteur',
            'ea',
            'voluptate',
            'qui',
            'culpa',
            'ad',
            'consectetur'
        ],
        'friends': [
            {
                'id': 0,
                'name': 'Marisa Rodgers'
            },
            {
                'id': 1,
                'name': 'Horton Walsh'
            },
            {
                'id': 2,
                'name': 'Phyllis Mcfadden'
            }
        ],
        'greeting': 'Hello, Brittany Ford! You have 7 unread messages.',
        'favoriteFruit': 'apple'
    }, {
        '_id': '552e5b1083e9293e653a6b88',
        'index': 5,
        'guid': '4eef53b0-b94a-491e-9619-76c1cd4ac3af',
        'isActive': false,
        'balance': '$1,519.14',
        'picture': 'http://placehold.it/32x32',
        'age': 39,
        'eyeColor': 'brown',
        'name': 'Goodwin Moran',
        'gender': 'male',
        'company': 'BUZZOPIA',
        'email': 'goodwinmoran@buzzopia.com',
        'phone': '+1 (920) 439-2098',
        'address': '396 Navy Walk, Kapowsin, Nevada, 4758',
        'about': 'Duis aute velit nulla adipisicing minim eu consectetur. Commodo reprehenderit occaecat eiusmod deserunt in excepteur proident dolor culpa. Voluptate ex do reprehenderit id do excepteur ut pariatur anim consectetur nisi.\r\n',
        'registered': '2014-04-30T12:15:35 -03:00',
        'latitude': 75.639913,
        'longitude': -4.107062,
        'tags': [
            'exercitation',
            'laborum',
            'enim',
            'qui',
            'laborum',
            'excepteur',
            'do'
        ],
        'friends': [
            {
                'id': 0,
                'name': 'Kasey Mccarty'
            },
            {
                'id': 1,
                'name': 'Marlene Noel'
            },
            {
                'id': 2,
                'name': 'Ofelia Gillespie'
            }
        ],
        'greeting': 'Hello, Goodwin Moran! You have 5 unread messages.',
        'favoriteFruit': 'strawberry'
    }, {
        '_id': '552e5b10c8a063f4a763217f',
        'index': 6,
        'guid': '0998ec7a-40e0-45ef-b38c-6774ec0a978c',
        'isActive': true,
        'balance': '$3,984.20',
        'picture': 'http://placehold.it/32x32',
        'age': 20,
        'eyeColor': 'brown',
        'name': 'Cathleen Perry',
        'gender': 'female',
        'company': 'NETPLODE',
        'email': 'cathleenperry@netplode.com',
        'phone': '+1 (833) 423-3898',
        'address': '430 Clay Street, Bayview, Montana, 3567',
        'about': 'Nostrud id duis cillum nulla cillum nisi reprehenderit quis sunt proident quis nisi. Commodo incididunt fugiat do mollit est nisi nisi ex aliqua duis ut officia anim duis. Lorem voluptate nostrud nulla dolore ipsum cupidatat Lorem cupidatat deserunt culpa quis anim. Exercitation elit do irure incididunt minim. Culpa officia qui labore ea occaecat culpa Lorem laborum commodo. Excepteur occaecat ad sit irure magna in excepteur elit dolor culpa adipisicing magna Lorem qui. Excepteur magna sit consequat anim in nisi aliqua est proident cillum aliqua non sit.\r\n',
        'registered': '2014-01-10T06:07:13 -02:00',
        'latitude': -15.036275,
        'longitude': 88.38041,
        'tags': [
            'exercitation',
            'deserunt',
            'ipsum',
            'consequat',
            'irure',
            'consectetur',
            'ipsum'
        ],
        'friends': [
            {
                'id': 0,
                'name': 'Hobbs Harmon'
            },
            {
                'id': 1,
                'name': 'Hampton Anderson'
            },
            {
                'id': 2,
                'name': 'Ilene Hickman'
            }
        ],
        'greeting': 'Hello, Cathleen Perry! You have 3 unread messages.',
        'favoriteFruit': 'strawberry'
    }
    ]);
    repl.context.msg = {$$: {frame: new Buffer(test)}};
})
.otherwise(function(er) {
    repl.context.err = er;
});
