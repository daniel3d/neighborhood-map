from flask import Flask, jsonify, abort, make_response, render_template, request

app = Flask(__name__)

@app.route("/")
def hello():
    return render_template('index.html')

if __name__ == '__main__':
    app.run(debug = True)