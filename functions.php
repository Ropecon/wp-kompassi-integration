<?php

function console_log( $out ) {
	echo '<script>console.log( "' . $out . '" );</script>';
}

// https://stackoverflow.com/questions/5341168/best-way-to-make-links-clickable-in-block-of-text
function make_links_clickable($text){
    return preg_replace('!(((f|ht)tp(s)?://)[-a-zA-Zа-яА-Я()0-9@:%_+.~#?&;//=]+)!i', '<a href="$1">$1</a>', $text);
}


?>
