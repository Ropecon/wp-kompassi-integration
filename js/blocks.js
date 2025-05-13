var el = wp.element.createElement;
var __ = wp.i18n.__;
var _x = wp.i18n._x;

var icon = el( 'svg', { width: '24', height: '24' },
   el( 'path', {
      d: 'M9 87.404a.083.083 0 0 1-.077-.052L6.73 81.974l-2.51 1.36c-.079.042-.19-.07-.148-.15l1.359-2.51-5.378-2.192a.084.084 0 0 1 0-.155l5.378-2.193-1.359-2.51c-.043-.079.07-.191.149-.148l2.51 1.359 2.192-5.378a.084.084 0 0 1 .155 0l2.193 5.378 2.51-1.36c.079-.042.191.07.148.15l-1.359 2.51 5.378 2.192c.07.028.07.127 0 .155l-5.007 2.042 1.194 2.53a.368.368 0 0 1-.079.425.367.367 0 0 1-.429.077l-2.493-1.245-2.056 5.041a.083.083 0 0 1-.078.053zm4.465-4.524-1.906-4.037c-.233-.429-.45-.833-.633-1.178-.434-.814-1.222-1.446-2.229-1.302a2.005 2.005 0 0 0-.537.156l-.275.15c-.249.16-.461.372-.622.62l-.147.274a2.01 2.01 0 0 0-.158.542c-.122.865.336 1.552.978 2.015zM9.01 79.337a.933.933 0 0 1 0-1.865.933.933 0 0 1 0 1.865z',
      transform: 'matrix(1.33333 0 0 -1.33333 0 116.54)'
   } )
);

/**
 *
 *
 */

wp.blocks.registerBlockType(
   'kompassi-integration/schedule',
   {
      title: __( 'Program Schedule', 'kompassi-integration' ),
      category: 'kompassi',
      icon: icon,
      supports: {
         align: true,
         multiple: false
      },
      attributes: {
         showToolbar: { type: 'boolean', default: 'true' },
         defaultOptions: { type: 'string', default: '' },
         default_display: { type: 'string', default: 'list' },
      },
      edit: function( props ) {
         return( [
            el( wp.components.Placeholder, {
               icon: icon,
               label: __( 'Program Schedule', 'kompassi-integration' ),
            }, ''
            ),
            el( wp.blockEditor.InspectorControls, null,
               el( wp.components.PanelBody, { title: __( 'Options', 'kompassi-integration' ) },
						el( wp.components.PanelRow, null,
							el( wp.components.ToggleControl, {
                        label: __( 'Show toolbar', 'kompassi-integration' ),
                        checked: props.attributes.showToolbar,
								onChange: function( value ) {
                           props.setAttributes( { showToolbar: !props.attributes.showToolbar } );
								}
                     } ),
                  ),
                  el( wp.components.PanelRow, null,
                     el( wp.components.TextControl, {
                        label: __( 'Default Options', 'kompassi-integration' ),
                        description: '..',
                        onChange: function( value ) {
                           props.setAttributes( { defaultOptions: value } )
                        }
                     } ),
						),
					)
				),
         ] );
      },
      save: function( props ) {
         return null;
      }
   }
);
