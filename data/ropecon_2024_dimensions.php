<?php
if (!function_exists('str_contains')) {
    function str_contains($haystack, $needle) {
        return $needle !== '' && mb_strpos($haystack, $needle) !== false;
    }
}

function ropecon_2024_dimensions( ) {
	$dimensions = array(
		'mode' => array(
			'display_name' => 'Toimintamuoto',
			'values' => array(
				'performance' => array( 'display_name' => 'Esitys', 'color' => 'rgba(116, 27, 71, 1)' ),
				'experience' => array( 'display_name' => 'Kokemus', 'color' => 'rgba(244, 227, 0, 1)', 'icon' => 'experience' ),
				'meetup' => array( 'display_name' => 'Miitti', 'color' => 'rgba(144, 228, 93, 1)' ),
				'gaming' => array( 'display_name' => 'Pelaaminen', 'color' => 'rgba(235, 152, 0, 1)' ),
				'talk' => array( 'display_name' => 'Puheohjelma', 'color' => 'rgba(62, 40, 171, 1)' ),
				'sport' => array( 'display_name' => 'Liikunnallinen', 'color' => 'rgba(255, 0, 70, 1)' ),
				'workshop' => array( 'display_name' => 'Työpaja',' color' => 'rgba(68, 185, 228, 1)' ),
				'exhibit' => array( 'display_name' => 'Näyttely' ),
				'OTHER' => array( 'display_name' => 'Muu toimintamuoto' ),
			)
		),
		'subject' => array(
			'display_name' => 'Aihepiiri',
			'values' => array(
				'figures' => array( 'display_name' => 'Figuurit', 'color' => 'rgba(64, 224, 208, 1)', 'icon' => 'figures' ),
				'boardgames' => array( 'display_name' => 'Lautapelit', 'icon' => 'boardgames' ),
				'cardgames' => array( 'display_name' => 'Korttipelit', 'icon' => 'cardgames' ),
				'crafts' => array( 'display_name' => 'Käsityö' ),
				'dance' => array( 'display_name' => 'Tanssiohjelma' ),
				'larp' => array( 'display_name' => 'Liveroolipelit', 'color' => 'rgba(11, 125, 9, 1)' ),
				'music' => array( 'display_name' => 'Musiikki' ),
				'rpg' => array( 'display_name' => 'Pöytäroolipelit', 'color' => 'rgba(171, 47, 169, 1)' ),
				'boffer' => array( 'display_name' => 'Boffaus' ),
            'OTHER' => array( 'display_name' => 'Muu aihepiiri' ),
         )
      ),
		'participation' => array(
			'display_name' => 'Osallistumistapa',
			'values' => array(
				'open' => array( 'display_name' => 'Avoin pelaaminen' ),
				'demo' => array( 'display_name' => 'Demo' ),
				'tournament' => array( 'display_name' => 'Turnaus', 'color' => 'rgba(196, 47, 52, 1)' ),
				'presentation' => array( 'display_name' => 'Esitelmä' ),
				'discussion' => array( 'display_name' => 'Keskustelu' ),
				'panel' => array( 'display_name' => 'Paneeli' ),
            'OTHER' => array( 'display_name' => 'Muu osallistumistapa' ),
			)
		),
    // 'space' => array(
    //  'display_name' => 'Tila',
    //  'values' => array( )
    //)
		'language' => array(
			'display_name' => 'Kieli',
			'values' => array(
				'language_free' => array( 'display_name' => 'Kielivapaa' ),
				'finnish_or_english' => array( 'display_name' => 'Suomi tai englanti' ),
				'finnish' => array( 'display_name' => 'Suomi' ),
				'english' => array( 'display_name' => 'Englanti' ),
			)
		),
		'age' => array(
			'display_name' => 'Ikä',
			'values' => array(
				'suitable_for_all_ages' => array( 'display_name' => 'Sopii kaikenikäisille' ),
				'aimed_at_children_under_13' => array( 'display_name' => 'Suunnattu alle 13-vuotiaille' ),
				'aimed_at_children_between_13_17' => array( 'display_name' => 'Suunnattu 13–17-vuotiaille' ),
				'aimed_at_adult_attendees' => array( 'display_name' => 'Suunnattu aikuisille' ),
				'for_18_plus_only' => array( 'display_name' => 'Vain täysi-ikäisille' ),
			)
		),
		'accessibility' => array(
			'display_name' => 'Esteettömyys',
			'values' => array(
				'cant_use_mic' => array( 'display_name' => 'En voi käyttää mikrofonia' ),
				'loud_sounds' => array( 'display_name' => 'Kovat äänet' ),
				'flashing_lights' => array( 'display_name' => 'Välkkyvät tai voimakkaat valot' ),
				'strong_smells' => array( 'display_name' => 'Voimakkaat tuoksut' ),
				'irritate_skin' => array( 'display_name' => 'Ihoa ärsyttävät aineet tai materiaalit' ),
				'physical_contact' => array( 'display_name' => 'Fyysinen kontakti ja/tai suppea henkilökohtaisen tilan mahdollisuus' ),
				'low_lightning' => array( 'display_name' => 'Pimeä/heikko valaistus' ),
				'moving_around' => array( 'display_name' => 'Osallistuminen vaatii paljon liikkumista ilman mahdollisuutta istumiseen' ),
				'programme_duration_over_2_hours' => array( 'display_name' => 'Ohjelma kestää yli kaksi tuntia ilman taukoa' ),
				'limited_opportunities_to_move_around' => array( 'display_name' => 'Ohjelman aikana on rajatut mahdollisuudet liikkumiseen' ),
				'video' => array( 'display_name' => 'Ohjelmanumerossa katsotaan video, jossa ei ole tekstitystä kuulorajoitteisille' ),
				'recording' => array( 'display_name' => 'Osallistuminen edellyttää sellaisen äänitteen kuuntelemista, josta ei ole tekstiversiota kuulorajoitteisille' ),
				'long_texts' => array( 'display_name' => 'Osallistuminen vaatii pitkien tekstien itsenäistä lukemista' ),
				'texts_not_available_as_recordings' => array( 'display_name' => 'Ohjelma sisältää osallistumisen kannalta olennaista tekstiä, josta ei ole saatavilla nauhoitetta tai jota ei lueta ääneen' ),
				'participation_requires_dexterity' => array( 'display_name' => 'Ohjelmaan osallistuminen vaatii sorminäppäryyttä' ),
				'participation_requires_react_quickly' => array( 'display_name' => 'Ohjelmaan osallistuminen vaatii nopeaa reaktiokykyä' ),
				'colourblind' => array( 'display_name' => 'Ohjelmanumerossa käytettävät materiaalit voivat tuottaa haasteita värisokeille' ),
			)
		)
	);
	return $dimensions;
}

function ropecon2023_to_2024_dimensions( $prog ) {
	// Category
	switch( $prog['category_title'] ) {
		case 'Esitysohjelma / Performance programme':
			$dimensions['mode'][] = 'performance';
			$dimensions['subject'][] = 'OTHER';
			$dimensions['participation'][] = 'OTHER';
			break;
		case 'Figupelit: avoin pelautus / Miniature wargames: Open game':
			$dimensions['mode'][] = 'gaming';
			$dimensions['subject'][] = 'figures';
			$dimensions['participation'][] = 'open';
			break;
		case 'Figupelit: demotus / Miniature wargames: Demo game':
			$dimensions['mode'][] = 'gaming';
			$dimensions['subject'][] = 'figures';
			$dimensions['participation'][] = 'demo';
			break;
		case 'Kokemuspiste: avoin pelautus / Experience Point: Open game':
			$dimensions['mode'][] = 'experience';
			$dimensions['subject'][] = 'OTHER';
			$dimensions['participation'][] = 'open';
			break;
		case 'Kokemuspiste: demotus / Experience Point: Demo game':
			$dimensions['mode'][] = 'experience';
			$dimensions['mode'][] = 'gaming';
			$dimensions['participation'][] = 'demo';
			break;
		case 'Kokemuspiste: muu / Experience Point: Other':
			$dimensions['mode'][] = 'experience';
			$dimensions['subject'][] = 'OTHER';
			$dimensions['participation'][] = 'OTHER';
			break;
		case 'LARP':
			$dimensions['mode'][] = 'gaming';
			$dimensions['subject'][] = 'larp';
			$dimensions['participation'][] = 'OTHER';
			break;
		case 'Miitti / Meetup':
			$dimensions['mode'][] = 'meetup';
			$dimensions['subject'][] = 'OTHER';
			$dimensions['participation'][] = 'OTHER';
			break;
		case 'Kokemuspiste: muu / Experience Point: Other':
			$dimensions['mode'][] = 'experience';
			$dimensions['subject'][] = 'OTHER';
			$dimensions['participation'][] = 'OTHER';
			break;
		case 'Muu peliohjelma / Other game programme':
			$dimensions['mode'][] = 'gaming';
			$dimensions['subject'][] = 'OTHER';
			$dimensions['participation'][] = 'OTHER';
			break;
		case 'Puheohjelma: esitelmä / Presentation':
			$dimensions['mode'][] = 'talk';
			$dimensions['subject'][] = 'OTHER';
			$dimensions['participation'][] = 'presentation';
			break;
		case 'Puheohjelma: keskustelu / Discussion group':
			$dimensions['mode'][] = 'talk';
			$dimensions['subject'][] = 'OTHER';
			$dimensions['participation'][] = 'discussion';
			break;
		case 'Puheohjelma: paneeli / Panel discussion':
			$dimensions['mode'][] = 'talk';
			$dimensions['subject'][] = 'OTHER';
			$dimensions['participation'][] = 'panel';
			break;
		case 'Roolipeli / Pen & Paper RPG':
			$dimensions['mode'][] = 'gaming';
			$dimensions['subject'][] = 'rpg';
			$dimensions['participation'][] = 'OTHER';
			break;
		case 'Tanssiohjelma / Dance programme':
			$dimensions['mode'][] = 'sport';
			$dimensions['subject'][] = 'dance';
			$dimensions['participation'][] = 'OTHER';
			break;
		case 'Turnaukset: figupelit / Tournament: Miniature wargames':
			$dimensions['mode'][] = 'gaming';
			$dimensions['subject'][] = 'figures';
			$dimensions['participation'][] = 'tournament';
			break;
		case 'Turnaukset: korttipelit / Tournament: Card games':
			$dimensions['mode'][] = 'gaming';
			$dimensions['subject'][] = 'cardgames';
			$dimensions['participation'][] = 'tournament';
			break;
		case 'Turnaukset: lautapelit / Tournament: Board games':
			$dimensions['mode'][] = 'gaming';
			$dimensions['subject'][] = 'boardgames';
			$dimensions['participation'][] = 'tournament';
			break;
		case 'Turnaukset: muu / Tournament: Other':
			$dimensions['mode'][] = 'gaming';
			$dimensions['subject'][] = 'OTHER';
			$dimensions['participation'][] = 'tournament';
			break;
		case 'Työpaja: figut / Workshop: miniature figurines':
			$dimensions['mode'][] = 'workshop';
			$dimensions['subject'][] = 'figures';
			$dimensions['participation'][] = 'OTHER';
			break;
		case 'Työpaja: käsityö / Workshop: crafts':
			$dimensions['mode'][] = 'workshop';
			$dimensions['subject'][] = 'crafts';
			$dimensions['participation'][] = 'OTHER';
			break;
		case 'Työpaja: musiikki / Workshop: music':
			$dimensions['mode'][] = 'workshop';
			$dimensions['subject'][] = 'music';
			$dimensions['participation'][] = 'OTHER';
			break;
		case 'Työpaja: muu / Workshop: other':
			$dimensions['mode'][] = 'workshop';
			$dimensions['subject'][] = 'OTHER';
			$dimensions['participation'][] = 'OTHER';
			break;
		default:
			$dimensions['mode'][] = 'OTHER';
			$dimensions['subject'][] = 'OTHER';
			$dimensions['participation'][] = 'OTHER';
			break;
	}

	// Tags
	if( isset( $prog['tags'] ) && count( $prog['tags'] ) > 0 ) {
		switch( $prog['tags'][0] ) {
			case 'aihe-figupelit':
				$dimensions['subject'][] = 'figures';
				break;
			case 'aihe-larpit':
				$dimensions['subject'][] = 'larp';
				break;
			case 'aihe-lautapelit':
				$dimensions['subject'][] = 'boardgames';
				break;
			case 'aihe-poytaroolipelit':
				$dimensions['subject'][] = 'rpg';
				break;
			case 'demo':
				$dimensions['participation'][] = 'demo';
				break;
			case 'kilpailuturnaus':
				$dimensions['participation'][] = 'tournament';
				break;
			case 'kunniavieras':
				break;
		}
	}

	// Even more manual converting
	if( str_contains( $prog['title'], 'näyttely' ) ) {
		$dimensions['mode'] = array( 'exhibit' );
	}
	if( str_contains( strtolower( $prog['title'] ), 'boff' ) ) {
		$dimensions['mode'] = array( 'sport' );
		$dimensions['subject'] = array( 'boffer' );
	}
	if( str_contains( $prog['title'], 'polttopallo' ) ) {
		$dimensions['mode'] = array( 'sport' );
	}

  // Space / Room name
  // $dimensions['space'][] = $prog['room_name'];
  // Also populate the dimension values

	// Language
	$dimensions['language'] = array( $prog['ropecon2023_language'] );

	// Age
	$dimensions['age'] = array();
	if( $prog['ropecon2023_suitable_for_all_ages'] ) { $dimensions['age'][] = 'suitable_for_all_ages'; }
	if( $prog['ropecon2023_aimed_at_children_under_13'] ) { $dimensions['age'][] = 'aimed_at_children_under_13'; }
	if( $prog['ropecon2023_aimed_at_children_between_13_17'] ) { $dimensions['age'][] = 'aimed_at_children_between_13_17'; }
	if( $prog['ropecon2023_aimed_at_adult_attendees'] ) { $dimensions['age'][] = 'aimed_at_adult_attendees'; }
	if( $prog['ropecon2023_for_18_plus_only'] ) { $dimensions['age'][] = 'for_18_plus_only'; }

	return $dimensions;
}

?>
