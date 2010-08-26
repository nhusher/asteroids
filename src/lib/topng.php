#!/usr/bin/php
<?php
$filename = $argv[1];

if(file_exists($filename))
{
	$iFileSize = filesize($filename);
	$iWidth = ceil(sqrt($iFileSize / 1));
	$iHeight = $iWidth;
	$im = imagecreate($iWidth, $iHeight);
	$fs = fopen($filename, 'r');
	$data = fread($fs, $iFileSize);

	fclose($fs);

	$i = 0;
	$colors = array();

	for($y = 0; $y < $iHeight; ++$y) {
		for($x = 0; $x < $iWidth; ++$x) {
			$ord = ord($data[$i]);
			$i += 1;

			if(!$colors[$ord]) {
				$colors[$ord] = imagecolorallocate($im,$ord,$ord,$ord);
			}

			$color = $colors[$ord];

			imagesetpixel($im, $x, $y, $color);
		}
	}

	header('Content-Type: image/png');
	imagepng($im);
	imagedestroy($im);
}
?>