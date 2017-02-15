var degree = process.argv[2];
console.log('child process here, i am asked to run hige calc on ' + degree + ' degree');

var a = [];
for (var i = 0; i < degree * 10000; i++) {
    a.push(Math.random()*10);
}

for (var x = 0; x < a.length; x++) {
    for (var y = x+1; y < a.length; y++) {
        if (a[y] > a[x]) {
            var temp = a[y];
            a[y] = a[x];
            a[x] = temp;
        }
    }
}

process.exit();
