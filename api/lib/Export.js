// Amaç: genel bir class'ımız olsun herhangi bir veri eport ettiğimizde bu class'daki ilgili metodu kullanalım
const xlsx = require("node-xlsx");

class Export {

    constructor() {


    }
    /**
     * 
     * @param {Array} titles Excel tablosu başlıkları                        ["ID", "CATEGORY NAME", "IS ACTIVE"]
     * @param {Array} columns Excel tablosuna yazılacak verilerin isimleri   [ id,   category_name,  is_active]
     * @param {Array} data Excel tablosuna yazılacak veriler
     */
    toExcel(titles, columns, data= []) {

        let rows = [];

        rows.push(titles);

        for (let i=0; i < data.length; i++) {
            let cols = [];
            let item = data[i];

            for (let j=0; j < columns.length; j++) {
                cols.push(item[columns[j]]);
            }

            rows.push(cols);
        }

        return xlsx.build([{name: "Sheet", data: rows}]);
    }
}

module.exports = Export;