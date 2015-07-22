<?php
	/////
	/// @author Tyler Benton
	/////


	/// @name main
	/// @description
	/// main method
	echo 'This is saying something';

	/// @name Something
	/// @description
	/// This is a normal multi-line comment.
    $ch = curl_init();

    curl_setopt($ch, CURLOPT_URL, "example.com");

    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);

    $output = curl_exec($ch);

    curl_close($ch);

	/// @name Something else
	/// @description
	/// This is another normal multi-line comment.

	$color = "red";
	echo "My car is " . $color . "<br>";
	echo "My house is " . $COLOR . "<br>";
	echo "My boat is " . $coLOR . "<br>";

	// This is a normal single-line comment.
?>