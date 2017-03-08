from flask import Flask, jsonify, abort, make_response, render_template

app = Flask(__name__)

@app.route("/")
def hello():
    return render_template('index.html', api_key='AIzaSyCUtjsz5EVKSHBw8rJMFBeASAyZQKOkGA4')

markers = [
    {
        'id': 1,
        'image': u'',
        'title': u'',
        'description': u''
    },
    {
        'id': 2,
        'image': u'',
        'title': u'',
        'description': u''
    }
]

    
@app.route('/api/markers', methods = ['GET'])
def get_tasks():
    return jsonify( { 'markers': markers } )

@app.route('/api/markers/<int:marker_id>', methods = ['GET'])
def get_task(marker_id):
    marker = filter(lambda m: m['id'] == marker_id, markers)
    if len(marker) == 0:
        abort(404)
    return jsonify( { 'marker': marker[0] } )

    
@app.errorhandler(400)
def not_found(error):
    return make_response(jsonify( { 'error': 'Bad request' } ), 400)

@app.errorhandler(404)
def not_found(error):
    return make_response(jsonify( { 'error': 'Not found' } ), 404)

if __name__ == '__main__':
    app.run(debug = True)