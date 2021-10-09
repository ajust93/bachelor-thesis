<?php
require_once("config.php");



$db = pg_connect("$host $port $dbname $credentials")
or die("Could not connect to server.");



if (isset($_POST["type"])) {

	if ($_POST["type"] === "checkwebsiteflags") {
		$flaggedWebsites = "";
		$websiteArray = explode(",", $_POST["websites"]);

		for ($i = 0; $i < count($websiteArray); $i++) {
			$query = "SELECT url FROM websites WHERE is_used = false AND url=$1";
			$prep = "prepare" . $i;
			pg_prepare($db, $prep, $query);
			$result = pg_execute($db, $prep, array($websiteArray[$i]));

			if (pg_num_rows($result) > 0) {
				$columns = pg_fetch_all($result);

				if (strlen($flaggedWebsites) > 0) {
					$flaggedWebsites .= ",";
				}

				$flaggedWebsites .= $columns[0]["url"];
			}

		}
		echo($flaggedWebsites);

	} else if ($_POST["type"] === "checklinkflags") {
		$flaggedLinks = "";
		$linkArray = explode(",", $_POST["links"]);

		for ($i = 0; $i < count($linkArray); $i++) {
			$query = "SELECT url FROM links WHERE is_used = false AND website=$1";
			$prep = "prepare" . $i;
			pg_prepare($db, $prep, $query);
			$result = pg_execute($db, $prep, array($linkArray[$i]));

			if (pg_num_rows($result) > 0) {
				$columns = pg_fetch_all($result);

				if (strlen($flaggedLinks) > 0) {
					$flaggedLinks .= ",";
				}

				$flaggedLinks .= $columns[0]["url"];
			}

		}
		echo($flaggedLinks);

	} else if ($_POST["type"] === "flagchange") {
		$table = "";
		$url = "";

		if (isset($_POST["website"])) {
			$table = "websites";
			$url = $_POST["website"];

		} else if (isset($_POST["link"])) {
			$table = "links";
			$url = $_POST["link"];
		}

		$query = "UPDATE " . $table .  " SET is_used = false, http_status=$1 WHERE url=$2";
		pg_prepare($db, "prepare1", $query);
		pg_execute($db, "prepare1", array($_POST["httpstatus"], $url));

	} else if ($_POST["type"] === "traininglog") {
		$query = "INSERT INTO training_logs (profile_id, day_difference, date_time, time_spent, websites_visited, websites_checked,
			links_visited, links_checked, flagged_websites, flagged_links) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)";

		pg_prepare($db, "prepare2", $query);
		pg_execute($db, "prepare2", array(
			$_POST["profile_id"], $_POST["day_difference"], $_POST["date_time"], $_POST["time_spent"],
			$_POST["websites_visited"], $_POST["websites_checked"], $_POST["links_visited"], $_POST["links_checked"],
			$_POST["flagged_websites"], $_POST["flagged_links"]
			)
		);

	} else if ($_POST["type"] === "debuglog") {
		$query = "INSERT INTO debug_logs (profile_id, day_difference, date_time, time_spent, last_link, websites_visited, websites_checked,
			links_visited, links_checked, flagged_websites, flagged_links) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)";

		pg_prepare($db, "prepare3", $query);
		pg_execute($db, "prepare3", array(
			$_POST["profile_id"], $_POST["day_difference"], $_POST["date_time"], $_POST["time_spent"],
			$_POST["last_link"], $_POST["websites_visited"], $_POST["websites_checked"], $_POST["links_visited"], $_POST["links_checked"],
			$_POST["flagged_websites"], $_POST["flagged_links"]
			)
		);
	}

}



pg_close($db);
?>