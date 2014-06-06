<?php
$wbfile = $_GET['wbfile'];
$operation = $_GET['operation'];

switch ($operation)
{
   case 'Load':
		session_start();
      $_SESSION['wbfile'] = $wbfile;
      header("Location: canvas.html");
      break;
   case 'Clone':
      copy('whiteboards/'.$wbfile, 'whiteboards/'.substr($wbfile, 0, -3).'Clone.wb');
      echo '<h1>Whiteboard cloned.</h1>';
      break;
   case 'Delete':
      unlink('whiteboards/'.$wbfile);
      echo '<h1>Whiteboard deleted.</h1>';
      break;
   case 'New':
      $newFilePath = 'whiteboards/' . $_GET['name'] . '.wb';
      if ($_GET['name']=='')
         echo '<h1>Invalid whiteboard name.</h1>';
      else if (file_exists($newFilePath))
         echo '<h1>A whiteboard with that name already exists.</h1>';
      else
      {
         fopen($newFilePath, 'w');
         echo '<h1>Whiteboard created.</h1>';
      }
      break;
   case 'Rename':
      if ($_GET['newname']=='')
         echo '<h1>Invalid whiteboard name.</h1>';
      else
      {
         rename('whiteboards/'.$wbfile, 'whiteboards/'.$_GET['newname'].'.wb');
         echo '<h1>Whiteboard renamed.</h1>';
      }
}

include 'index.php';
?>
