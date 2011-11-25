function search(q)
{
	var quotes = document.getElementsByClassName('quotes');
	for( var i in quotes ) 
	{
		if( quotes[i].innerHTML == undefined ) continue;
		quotes[i].className = quotes[i].innerHTML.indexOf(q) == -1 ? 'quotes hidden' : 'quotes';
	}
}
