先把hf上的数据下载下来，然后放入dataTransfer文件夹下，运行convert.py
然后运行transfer.py做初步清洗
得到的json数据依次运行
```shell
node fiter_isolated_node.js
node convert_script.js
node convert_scropt2.js
```

或者直接运行我写的shell文件
```shell
chmod +x run_pipeline.sh
./run_pipeline.sh
```
 