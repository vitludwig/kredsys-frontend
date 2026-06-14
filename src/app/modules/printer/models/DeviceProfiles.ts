export const DeviceProfiles = [

	/* Epson TM-P series, for example the TM-P20II */
	{
		filters: [
			{
				namePrefix: 'TM-P'
			}
		],

		functions: {
			'print':		{
				service: 		'49535343-fe7d-4ae5-8fa9-9fafd205e455',
				characteristic:	'49535343-8841-43f4-a8d4-ecbe34729bb3'
			},

			'status':		{
				service: 		'49535343-fe7d-4ae5-8fa9-9fafd205e455',
				characteristic:	'49535343-1e4d-4bd9-ba61-23c647249616'
			}
		},

		language:			'esc-pos',
		codepageMapping:	'epson'
	},

	/* Star SM-L series, for example the SM-L200 */
	{
		filters: [
			{
				namePrefix: 'STAR L'
			}
		],

		functions: {
			'print':		{
				service: 		'49535343-fe7d-4ae5-8fa9-9fafd205e455',
				characteristic:	'49535343-8841-43f4-a8d4-ecbe34729bb3'
			},

			'status':		{
				service: 		'49535343-fe7d-4ae5-8fa9-9fafd205e455',
				characteristic:	'49535343-1e4d-4bd9-ba61-23c647249616'
			}
		},

		language:			'star-line',
		codepageMapping:	'star'
	},

	/* POS-5805, POS-8360 and similar printers */
	{
		filters: [
			{
				name: 		'BlueTooth Printer',
				services: 	[ '000018f0-0000-1000-8000-00805f9b34fb' ]
			}
		],

		functions: {
			'print':		{
				service: 		'000018f0-0000-1000-8000-00805f9b34fb',
				characteristic:	'00002af1-0000-1000-8000-00805f9b34fb'
			},

			'status':		{
				service: 		'000018f0-0000-1000-8000-00805f9b34fb',
				characteristic:	'00002af0-0000-1000-8000-00805f9b34fb'
			}
		},

		language:			'esc-pos',
		codepageMapping:	'zjiang'
	},

	/* Xprinter */
	{
		filters: [
			{
				name: 		'Printer001',
				services: 	[ '000018f0-0000-1000-8000-00805f9b34fb' ]
			}
		],

		functions: {
			'print':		{
				service: 		'000018f0-0000-1000-8000-00805f9b34fb',
				characteristic:	'00002af1-0000-1000-8000-00805f9b34fb'
			},

			'status':		{
				service: 		'000018f0-0000-1000-8000-00805f9b34fb',
				characteristic:	'00002af0-0000-1000-8000-00805f9b34fb'
			}
		},

		language:			'esc-pos',
		codepageMapping:	'xprinter'
	},

	/* MPT-II printer */
	{
		filters: [
			{
				name: 		'MPT-II',
				services: 	[ '000018f0-0000-1000-8000-00805f9b34fb' ]
			}
		],

		functions: {
			'print':		{
				service: 		'000018f0-0000-1000-8000-00805f9b34fb',
				characteristic:	'00002af1-0000-1000-8000-00805f9b34fb'
			},

			'status':		{
				service: 		'000018f0-0000-1000-8000-00805f9b34fb',
				characteristic:	'00002af0-0000-1000-8000-00805f9b34fb'
			}
		},

		language:			'esc-pos',
		codepageMapping:	'mpt'
	},

	/* Cat printer */
	{
		filters: [
			{
				services: 	[ '0000ae30-0000-1000-8000-00805f9b34fb' ]
			}
		],

		functions: {
			'print':		{
				service: 		'0000ae30-0000-1000-8000-00805f9b34fb',
				characteristic:	'0000ae01-0000-1000-8000-00805f9b34fb'
			},

			'notify':		{
				service: 		'0000ae30-0000-1000-8000-00805f9b34fb',
				characteristic:	'0000ae02-0000-1000-8000-00805f9b34fb'
			}

		},

		language:			'meow',
		codepageMapping:	'default',
		messageSize:		200,
		sleepAfterCommand:	30
	},

	/* Generic printer */
	{
		filters: [
			{
				services: 	[ '000018f0-0000-1000-8000-00805f9b34fb' ]
			}
		],

		functions: {
			'print':		{
				service: 		'000018f0-0000-1000-8000-00805f9b34fb',
				characteristic:	'00002af1-0000-1000-8000-00805f9b34fb'
			},

			'status':		{
				service: 		'000018f0-0000-1000-8000-00805f9b34fb',
				characteristic:	'00002af0-0000-1000-8000-00805f9b34fb'
			}
		},

		language:			'esc-pos',
		codepageMapping:	'default'
	}
]
