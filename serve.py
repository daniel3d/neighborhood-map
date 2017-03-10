from flask import Flask, jsonify, abort, make_response, render_template, request

app = Flask(__name__)

@app.route("/")
def hello():
    return render_template('index.html', api_key='AIzaSyCUtjsz5EVKSHBw8rJMFBeASAyZQKOkGA4')

markers = [
    {
        'id': 1,
        'image': u'https://c1.staticflickr.com/6/5788/21200534656_39e2820ec5_k.jpg',
        'title': u'London location',
        'description': u'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum is simply dummy text of the printing and typesetting industry.'
    },
    {
        'id': 2,
        'image': u'https://c1.staticflickr.com/1/686/21200536326_4d35ac8a36_k.jpg',
        'title': u'London location 2',
        'description': u'Lorem Ipsum is simply dummy text of the printing and typesetting industry.'
    }
]


@app.route('/api/markers', methods = ['GET'])
def get_tasks():
    nw = request.args.getlist('nw[]')
    sw = request.args.getlist('sw[]')

    if nw and sw:
        return jsonify([nw, sw])
    else:
        return jsonify(markers)

@app.route('/api/markers/<int:marker_id>', methods = ['GET'])
def get_task(marker_id):
    marker = filter(lambda m: m['id'] == marker_id, markers)
    if len(marker) == 0:
        abort(404)
    return jsonify(marker[0])

    
@app.errorhandler(400)
def not_found(error):
    return make_response(jsonify( { 'error': 'Bad request' } ), 400)

@app.errorhandler(404)
def not_found(error):
    return make_response(jsonify( { 'error': 'Not found' } ), 404)

if __name__ == '__main__':
    app.run(debug = True)