from flask import Flask
import os 

app = Flask(__name__)
folder_path = "C:/Users/youri/Dev/Hackclub/NEW/The rule of thumb/"
@app.route("/Analyze/<file_name>",methods=["GET"])
def get_the_contents(file_name):
    file_path = os.path.join(folder_path,file_name)
    if not os.path.exists(file_path):
        return {"error":f"'{file_name}' not found  in '{folder_path}'"},404
    try:
        with open(file_path,'r',encoding="utf-8") as file:
            content = file.read()


            return{
                "filename":file_name,
                "content":content
            }

    except Exception as e:
        return{"error":str(e)},500


if __name__ == '__main__':
    app.run(debug=True)