import flask, os, requests, re, json
app = flask.Flask(__name__)

@app.route("/")
def index():
	return makeDemo()

def explore(where = None, page = 0):
	payload = {
		'authenticity_token' : 'eIZuEH8NOVjXUGdHH676SsGBDIKtKorqHTmZ31rLhRY=',
		'ajax' : 1,
		'page': page,
		'loc' : '641 O\'Farrell St, San Francisco, CA 94109, USA',
	}
	r = requests.get("http://www.foodspotting.com/explore", params=payload)
	#	pattern = #re.compile('^Sightings') #re.compile('^Sightings \= \[\{.*?\}\]$')
	t = re.search(r'Sightings \= \[\{.*\}\]', r.text)

	return json.loads(t.group(0)[12:])

def makeDemo():
	html = ""
	for p in xrange(1,5):
		print 'page ' + str(p)
		for x in explore( page = p):
			html+= x['title'] + '<br><img src="' + x['photo'].replace('thumb_90', 'thumb_600') +'"/><br>'
	return html


if __name__ == "__main__":
	port = int(os.environ.get("PORT", 5000))
	app.debug = True
	app.run(host='0.0.0.0', port=port)
	