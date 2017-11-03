import os
from flask import Flask, render_template, request, jsonify
import googlemaps

PLACE_TYPES = ['park', 'church', 'museum', 'post_office', 'school', 'courthouse', 'point_of_interest']
API_KEY = os.environ['GMAPS_KEY']

app = Flask(__name__)

@app.route('/')
def home():
    return render_template('index.html')

# Radius and Location are provided as query parameters
@app.route('/places')
def places():

    location = request.args.get('location', default="0,0", type=str)

    if location == '0,0':
        raise InvalidUsage('Please Provide a location')

    radius = request.args.get('radius', type=int)

    if not radius:
        raise InvalidUsage('Please provide a radius in meters')

    return jsonify(search_places(location, radius))

def search_places(location, radius):
    gmaps = googlemaps.Client(key=API_KEY)

    types = ','.join(PLACE_TYPES)

    places_results = gmaps.places_nearby(location=location, radius=radius, type=types)['results']

    results = []

    for place in places_results:
        dist_matrix_result = gmaps.distance_matrix(location, place['geometry']['location'], mode='walking', units='imperial')
        place_result = {
            'distance' : dist_matrix_result['rows'][0]['elements'][0]['distance']['value'],
            'name' : place['name'],
            'id' : place['id'],
            'types' : place['types'],
            'location' : place['geometry']['location']
        }
        results.append(place_result)

    return results

# Class to handle errors, source:  http://flask.pocoo.org/docs/0.12/patterns/apierrors/
class InvalidUsage(Exception):
    status_code = 400

    def __init__(self, message, status_code=None, payload=None):
        Exception.__init__(self)
        self.message = message
        if status_code is not None:
            self.status_code = status_code
        self.payload = payload

    def to_dict(self):
        ret = dict(self.payload or ())
        ret['message'] = self.message
        return ret

# Registers the error handling class
@app.errorhandler(InvalidUsage)
def handle_invalid_usage(error):
    response = jsonify(error.to_dict())
    response.status_code = error.status_code
    return response
