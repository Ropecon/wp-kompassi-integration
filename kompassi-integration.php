<?php
/**
 *  Plugin Name: Kompassi Integration
 *  Description:
 *  Author: Pasi Lallinaho
 *  Version: 2023
 *  Text Domain: kompassi-integration
 *
 */


class WP_Plugin_Kompassi_Integration {
	private string $ver;

	function __construct( ) {
		add_action( 'init', array( &$this, 'init' ) );
		add_action( 'admin_init', array( &$this, 'admin_init' ) );
		add_action( 'admin_menu', array( &$this, 'admin_menu' ) );
		add_action( 'enqueue_block_assets', array( &$this, 'enqueue_block_assets' ) );
		add_filter( 'block_categories_all', array( &$this, 'block_categories_all' ), 10, 2 );

		$this->ver = time( );
	}

	function init( ) {
		load_plugin_textdomain( 'kompassi-integration', false, dirname( plugin_basename( __FILE__ ) ) . '/languages' );

		register_block_type(
			'kompassi-integration/schedule',
			array(
				'editor_script' => 'kompassi-integration-blocks',
				'is_dynamic' => true,
				'render_callback' => array( &$this, 'block_schedule' ),
				'attributes' => array(
					'default_display' => array( 'type' => 'string', 'default' => 'list' ),
				),
			)
		);
	}

	function admin_init( ) {
		add_settings_section( 'kompassi-integration-general', '', '', 'kompassi_integration_settings' );

		$fields = array(
			'event_slug' => array(
				'label' => __( 'Event Slug', 'kompassi-integration' ),
				'description' => __( 'Event slug in Kompassi.', 'kompassi-integration' )
			),
			'schedule_start_of_day' => array(
				'label' =>  __( 'Start of Day', 'kompassi-integration' ),
				'description' => __( 'Start of Day when a single day is shown.', 'kompassi-integration' )
			),
			'schedule_end_of_day' => array(
				'label' =>  __( 'End of Day', 'kompassi-integration' ),
				'description' => __( 'End of Day when a single day is shown.', 'kompassi-integration' )
			),
			'hidden_dimensions' => array(
				'label' => __( 'Hidden Dimensions', 'kompassi-integration' ),
				'description' => __( 'Comma-separated list of dimension slugs that should be hidden from filters.', 'kompassi-integration' )
			),
			'timeline_grouping' => array(
				'label' => __( 'Timeline Grouping', 'kompassi-integration' ),
				'description' => __( 'Dimension slug for the dimension that should be used to group program with subheadings in timeline.', 'kompassi-integration' )
			)
		);

		foreach( $fields as $key => $data ) {
			$data['field_name'] = 'kompassi_integration_' . $key;
			$data['sanitize_callback'] = 'sanitize_text_field';
			add_settings_field( 'kompassi_integration_' . $key, $data['label'], array( &$this, 'setting_field' ), 'kompassi_integration_settings', 'kompassi-integration-general', $data );
			register_setting( 'kompassi_integration_settings', $data['field_name'], $data );
		}
	}

	function admin_menu( ) {
		add_menu_page( __( 'Kompassi Integration', 'kompassi-integration' ), 'Kompassi', 'manage_options', 'kompassi_integration_settings', array( &$this, 'admin_page_settings' ), 'dashicons-book', 100 );
	}

	function admin_page_settings( ) {
		echo '<div class="wrap"><form action="options.php" method="POST">';
		echo '<h1>' . __( 'Kompassi Integration', 'kompassi-integration' ) . '</h1>';
		settings_fields( 'kompassi_integration_settings' );
		do_settings_sections( 'kompassi_integration_settings' );
		submit_button( __( 'Save Changes', 'kompassi-integration' ) );
		echo '</form></div>';
	}

	function setting_field( $data ) {
		echo '<p><input type="text" id="' . $data['field_name'] . '" name="' . $data['field_name'] . '" class="widefat" value="' . get_option( $data['field_name'] ) . '"/></p>';
		if( isset( $data['description'] ) ) {
			echo '<p class="description">' . $data['description'] . '</p>';
		}
	}

	function enqueue_block_assets( ) {
		wp_register_script( 'kompassi-integration-blocks', plugins_url( 'js/blocks.js', __FILE__ ), array( 'wp-blocks', 'wp-element', 'wp-components', 'wp-i18n' ), $this->ver );
		wp_set_script_translations( 'kompassi-integration-blocks', 'kompassi-integration', plugin_dir_path( __FILE__ ) . 'languages/' );

		if( !is_admin( ) ) {
			wp_register_script( 'kompassi-integration-frontend-common', plugins_url( 'js/frontend-common.js', __FILE__ ), array( ), $this->ver );
			wp_register_style( 'kompassi-integration-fonts', plugins_url( 'fonts/fonts.css', __FILE__ ), array( ), $this->ver );
			wp_register_style( 'kompassi-integration-frontend-common', plugins_url( 'css/frontend-common.css', __FILE__ ), array( 'kompassi-integration-fonts'), $this->ver );

			if( has_block( 'kompassi-integration/schedule' ) ) {
				wp_enqueue_script( 'js-cookie', plugins_url( 'lib/js.cookie.min.js', __FILE__ ), array( ), '3.0.5' );
				wp_enqueue_script( 'dayjs', plugins_url( 'lib/dayjs.min.js', __FILE__ ), array( ), '1.11.10' );

				wp_enqueue_script( 'kompassi-integration-schedule', plugins_url( 'js/schedule.js', __FILE__ ), array( 'kompassi-integration-frontend-common', 'jquery', 'wp-i18n', 'js-cookie' ), $this->ver );
				wp_set_script_translations( 'kompassi-integration-schedule', 'kompassi-integration', plugin_dir_path( __FILE__ ) . 'languages/' );
				$js_strings = array(
					'schedule_start_of_day' => get_option( 'kompassi_integration_schedule_start_of_day', 0 ),
					'schedule_end_of_day' => get_option( 'kompassi_integration_schedule_end_of_day', 0 ),
					'hidden_dimensions' => explode( ',', get_option( 'kompassi_integration_hidden_dimensions', '' ) ),
					'timeline_grouping' => get_option( 'kompassi_integration_timeline_grouping' ),
				);
				wp_localize_script( 'kompassi-integration-schedule', 'kompassi_options', $js_strings );

				wp_enqueue_style( 'kompassi-integration-frontend', plugins_url( 'css/schedule.css', __FILE__ ), array( 'kompassi-integration-frontend-common' ), $this->ver );
			}
		} else {
			wp_enqueue_style( 'kompassi-integration-editor', plugins_url( 'css/editor.css', __FILE__ ), array( ), $this->ver );
		}
	}

	function block_categories_all( $categories, $editor_context ) {
		if( !$editor_context instanceof WP_Block_Editor_Context ) {
			return $categories;
		}

		$categories[] = array(
			'slug' => 'kompassi',
			'title' => 'Kompassi',
		);

		return $categories;
	}

	/*
	 *  Fetch data from GraphQL
	 *  TODO: #9 - Caching?
	 *
	 */

	function get_data_graphql( ) {
		$query = array(
			'query' => file_get_contents( plugins_url( 'graphql/ProgramListQuery.gql', __FILE__ ) ),
			'variables' => array(
				'eventSlug' => get_option( 'kompassi_integration_event_slug' ),
				'locale' => get_locale( )
			)
		);
		$options = array(
			'http' => array(
				'method' => 'POST',
				'content' => json_encode( $query ),
				'header' => "Content-Type: application/json\r\n" .
					"Accept: application/json\r\n"
			)
		);
		$context = stream_context_create( $options );
		$json = file_get_contents( 'https://kompassi.eu/graphql', false, $context );
		$response = json_decode( $json, true );
		return $response['data']['event']['program'];
	}

	/*
	 *  Show the schedule block
	 *
	 */

	function block_schedule( $attributes ) {
		$html_attrs = array( 'class' => '' );
		if( isset( $attributes['align'] ) ) { $html_attrs['class'] .= ' align' . $attributes['align']; }

		$out = '<div id="kompassi_block_schedule" ' . get_block_wrapper_attributes( $html_attrs ) . '>';

		/*  Schedule  */
		$out .= '<section id="kompassi_schedule" class="' . $attributes['default_display'] . '">';
		if( strlen( get_option( 'kompassi_integration_event_slug' ) ) > 0 ) {
			$data = $this->get_data_graphql( );
		} else {
			return;
		}

		if( !$data || count( $data ) < 1 ) {
			return;
		}

		// Map dimension value labels to array
		$dimension_value_labels = array( );
		foreach( $data['dimensions'] as $dimension ) {
			foreach( $dimension['values'] as $value ) {
				$dimension_value_labels[$dimension['slug']][$value['slug']] = $value['title'];
			}
		}

		foreach( $data['programs'] as $p ) {
			$out .= $this->markup_program( $p, $dimension_value_labels );
		}
		$out .= '</section>';

		/*  TODO: For now, output dimensions JSON with a script tag right here... */
		$out .= '<script>kompassi_schedule_dimensions = ' . json_encode( $data['dimensions'] ) . '</script>';

		/*
		 *  Program colors
		 *  Color values from dimensions later in the data will override earlier values
		 *  Philosophically, more specific tags should take precendence
		 *
		 */
		$out .= '<style>';
		foreach( $data['dimensions'] as $dimension_slug => $dimension ) {
			foreach( $dimension['values'] as $value_slug => $value ) {
				if( isset( $value['color'] ) || isset( $value['icon'] ) ) {
					$out .= ' #kompassi_schedule article[data-' . $dimension_slug . '="' .  $value_slug . '"] {';
					if( isset( $value['color'] ) ) {
						$out .= '  --kompassi-program-color: ' . $value['color'] . '; ';
					}
					if( isset( $value['icon'] ) ) {
						$out .= '  --kompassi-program-icon: url(' . $value['icon'] . '); ';
					}
					$out .= ' }';
				}
			}
		}
		$out .= '</style>';

		$out .= $this->data_provided_image( );
		$out .= '</div>';
		return $out;
	}

	/*
	 *  Return markup for a single program event
	 *
	 */

	function markup_program( $program, $dimension_value_labels ) {
		if( !is_array( $program['scheduleItems'] ) || count( $program['scheduleItems'] ) < 1 ) {
			return;
		}

		ob_start( );
		$program['start'] = $program['scheduleItems'][0]['startTimeUnixSeconds'];
		$program['end'] = $program['scheduleItems'][0]['endTimeUnixSeconds'];
		$program['length'] = $program['scheduleItems'][0]['lengthMinutes'];
		$program['identifier'] = $program['slug'];

		$attrs = array(
			'id' => $program['identifier'],
			'length' => $program['length'], // Required for timeline calculations
			'start' => $program['start'],
			'end' => $program['end'],
		);
		foreach( $program['cachedDimensions'] as $dimension => $values ) {
			if( count( $values ) > 0 ) {
				$attrs[$dimension] = $values[0];
			}
		}

		$html_attrs = '';
		foreach( $attrs as $attr => $value ) {
			$html_attrs .= ' data-' . $attr . '="' . $value . '"';
		}
		$program['description'] = nl2br( $program['description'] );
		?>
			<article id="<?php echo $program['identifier']; ?>" class="kompassi-program" <?php echo $html_attrs; ?>>
				<div class="title" style="grid-area: title;"><?php echo $program['title']; ?></div>
				<div class="main" style="grid-area: main;">
					<?php echo $program['description']; ?>
				</div>
				<div class="meta" style="grid-area: meta;">
					<?php
						// TODO: Kompassi: List meta fields to show
						foreach( array( 'times', 'cachedHosts' ) as $key ) {
							$value = '';
							if( isset( $program[$key] ) ) {
								$value = $program[$key];
								if( is_array( $value ) ) {
									$value = implode( ',', $value );
								}
							} else {
								// TODO: #11 - Get directly from Kompassi?
								if( 'times' == $key ) {
									$offset = get_option( 'gmt_offset' ) * 60 * 60;
									$value = date_i18n( get_option( 'date_format' ) . ' ' . get_option( 'time_format' ), $program['start'] + $offset );
									$value .= ' – ';
									if( date_i18n( 'Ymd', $program['start'] + $offset ) == date_i18n( 'Ymd', $program['end'] + $offset ) ) {
										$value .= date_i18n( get_option( 'time_format' ), $program['end'] + $offset );
									} else {
										// If multiday, show both days
										$value .= date_i18n( get_option( 'date_format' ) . ' ' . get_option( 'time_format' ), $program['end'] + $offset );
									}
									$value .= ' <span class="length">';
									$h = $program['length'] / 60;
									$min = $program['length'] % 60;
									if( $h < 1 ) {
										$value .= $min . 'min';
									} elseif( $min == 0 ) {
										$value .= floor( $h ) . 'h';
									} else {
										$value .= floor( $h ) . 'h ' . $min . 'min';
									}
									$value .= '</span>';
								}
							}
							if( isset( $value ) ) {
								echo '<div class="' . $key . '">' . $value . '</div>';
							}
						}
					?>
					<?php
						// Traverse through dimensions
						foreach( $program['cachedDimensions'] as $dimension => $values ) {
							echo '<div class="dimension ' . $dimension . '">';

							foreach( $values as $slug ) {
								if( isset( $dimension_value_labels[$dimension][$slug] ) ) {
									echo '<span class="value">' . $dimension_value_labels[$dimension][$slug] . '</span> ';
								} else {
									echo '<span class="value">' . $slug . '</span> ';
								}
							}
							echo '</div>';
						}
					?>
				</div>
				<?php
					echo '<div class="actions" style="grid-area: actions;">';
					foreach( $program['links'] as $link ) {
						echo '<a href="' . $link['href'] . '" class="' . strtolower( $link['type'] ) . ' kompassi-icon-' . strtolower( $link['type'] ) . '" title="' . $link['title'] . '"></a>';
					}
					echo '</div>';
				?>
			</article>
		<?php
		return ob_get_clean( );
	}

	/**
	 *  Sorts program by event starting time
	 *  Callable function for usort()
	 */

	function sort_by_starting_time( $a, $b ) {
		if( $a['start_timestamp'] > $b['start_timestamp'] ) {
			return 1;
		} elseif( $b['start_timestamp'] > $a['start_timestamp'] ) {
			return -1;
		} else {
			return 0;
		}
	}

	/**
	 *  Returns a "Data provided by Kompassi" image
	 *
	 */

	function data_provided_image( ) {
		return '<div class="kompassi_provided"><a href="https://kompassi.eu/"><img src="' . plugins_url( '/images/kompassi_provided.svg', __FILE__ ) . '" alt="Data provided by Kompassi" /></a></div>';
	}
}

new WP_Plugin_Kompassi_Integration( );
