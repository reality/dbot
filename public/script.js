function search(q)
{
	var quotes = document.getElementsByClassName('quotes');
	for( var i in quotes ) 
	{
		if( quotes[i].innerHTML == undefined ) continue;
		quotes[i].className = quotes[i].innerHTML.indexOf(q) == -1 ? 'quotes hidden' : 'quotes';
	}
}

function searchNotifies(q) {
    var notifies = document.getElementById('notifies');
    for (var i=1, row; row=notifies.rows[i]; i++) {
        console.log(row);
        if(row.cells[3].innerHTML.indexOf(q) == -1) {
            row.style.display = 'none';
        } else {
            row.style.display = '';
        }
    }
}
