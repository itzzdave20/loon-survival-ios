
_game_ref=None
def re_init(game_ref):
	global _game_ref
	_game_ref = game_ref
	
def load_loading_screen():
	import scripts.cards.loading_screen
	LoadingScreen = scripts.cards.loading_screen.LoadingScreen
	_game_ref.l_screen = LoadingScreen(_game_ref)
	return 'Loading {}...'.format('Loading Screen')
	
def load_audio():
	import scripts.scene_objects.audio
	DefaultAudio = scripts.scene_objects.audio.DefaultAudio
	_game_ref.audio = DefaultAudio(_game_ref, **_game_ref.kw_args)
	return 'Loading {}...'.format('Audio')
	
def load_event_manager():
	import scripts.game.event_manager
	EventManager = scripts.game.event_manager.EventManager
	_game_ref.event = EventManager(_game_ref)	
	return 'Loading {}...'.format('Event Manager')
	
def load_floor():
	import scripts.scene_objects.floor
	DefaultFloor = scripts.scene_objects.floor.DefaultFloor
	_game_ref.floor = DefaultFloor(_game_ref, **_game_ref.kw_args)
	return 'Loading {}...'.format('Floor')
	
def load_font_manager():
	import scripts.modules.fonts
	fonts = scripts.modules.fonts
	return 'Loading {}...'.format('Font Manager')
	
def load_graph():
	import scripts.game.graph_manager
	GameGraph = scripts.game.graph_manager.GameGraph
	_game_ref.graph_mngr = GameGraph(_game_ref, **_game_ref.kw_args)
	return 'Loading {}...'.format('Graph')

def load_hud():
	import scripts.bases.timed_updates.timed_quadrant
	TimedQuadrant = scripts.bases.timed_updates.timed_quadrant.TimedQuadrant
	_game_ref.hud = TimedQuadrant(_game_ref)
	return 'Loading {}...'.format('Hud')
	
def load_minimap():
	import scripts.screen_objects.minimaps
	DefaultMinimap = scripts.screen_objects.minimaps.DefaultMinimap
	_game_ref.minimap = DefaultMinimap(_game_ref, hide=True)
	return 'Loading {}...'.format('Map')
	
def load_player():
	import scripts.scene_objects.player
	DefaultPlayer = scripts.scene_objects.player.DefaultPlayer
	# If the loaded world contains a player start marker, use it
	try:
		ws = None
		if hasattr(_game_ref, 'graph_mngr') and hasattr(_game_ref.graph_mngr, 'world'):
			ws = _game_ref.graph_mngr.world
		if ws and getattr(ws, 'player_start', None):
			px, py, pa = ws.player_start
			_game_ref.player = DefaultPlayer(_game_ref, player_pos_x=px, player_pos_y=py, player_angle=pa, **_game_ref.kw_args)
		else:
			_game_ref.player = DefaultPlayer(_game_ref, **_game_ref.kw_args)
	except Exception:
		_game_ref.player = DefaultPlayer(_game_ref, **_game_ref.kw_args)
	return 'Loading {}...'.format('Player')

def load_pre_primary_loop():
	import scripts.modules.loops.pre_primary_loop
	ppl = scripts.modules.loops.pre_primary_loop
	_game_ref.pre_primary_loop = ppl
	_game_ref.pre_primary_loop.re_init(_game_ref)
	return 'Loading {}...'.format('Pre Primary Loop')

def load_primary_loop():
	import scripts.modules.loops.primary_loop
	pl = scripts.modules.loops.primary_loop
	_game_ref.primary_loop = pl
	_game_ref.primary_loop.re_init(_game_ref)
	return 'loading {}...'.format('Primary Loop') 
		
def load_secondary_loop():
	import scripts.modules.loops.secondary_loop
	scl = scripts.modules.loops.secondary_loop
	_game_ref.secondary_loop = scl
	_game_ref.secondary_loop.re_init(_game_ref)
	return 'Loading {}...'.format('Secondary Loop') 
	
def load_sky():
	import scripts.scene_objects.sky
	DefaultSky = scripts.scene_objects.sky.DefaultSky
	_game_ref.sky = DefaultSky(_game_ref, hide=True, **_game_ref.kw_args)
	return 'Loading {}...'.format('Sky')
	
def load_sprite_space():
	import scripts.spaces.scene_sprites_container
	SceneSpritesContainer = scripts.spaces.scene_sprites_container.SceneSpritesContainer
	_game_ref.sprite_space = SceneSpritesContainer(_game_ref, hide=True)
	return 'Loading {}...'.format('Sprite Space')

def load_text_card_manager():
	import scripts.game.card_manager
	CardManager = scripts.game.card_manager.CardManager
	_game_ref.tc_mngr = CardManager(_game_ref)
	return 'Loading {}...'.format('Text Card Manager')
	
def load_world():
	import scripts.scene_objects.world
	World = scripts.scene_objects.world.World
	_game_ref.world = World(_game_ref, hide=True)	
	return 'Loading {}...'.format('World')
	 
							
_load_iterator = (func for func in (
									load_graph, 
									load_font_manager,
									load_pre_primary_loop,
									load_audio,
									load_text_card_manager,
									
									load_primary_loop,
									load_sky,
									load_floor,
									load_world,
									load_sprite_space,
									load_player,
									load_hud,
									
									load_minimap,
									
									load_secondary_loop
									))


def update(dt=0, game_ref=None):	
	if not _game_ref:
		re_init(game_ref)
	
	return next(_load_iterator)(), False
