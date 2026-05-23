
import os
import scripts.bases.base
Base = scripts.bases.base.Base

_WORLD_PATH = 'scripts/resources/docs/default_world_map.txt'


class World(Base):
	""" Class that holds the data about world the game is currently in """
	def __init__(self, game, world_path='', **kwargs):
		super().__init__(game=game)
		
		self.graph = {}
		self.width = 0
		self.height = 0
		self.string = ''
		self.spawn_list = []
		self.player_start = None
		self.sectors = {}
		self.world_path = _WORLD_PATH
		
		if os.path.isfile(world_path):
			self.world_path = world_path
		
		self.set_world_dimensions()
	
	#<----Base Functions: re_init, update		
	def re_init(self, world_path = '', **kwargs):
		super().re_init()
		self.graph = {}
		self.width = 0
		self.height = 0
		self.string = ''
		self.spawn_list = []
		self.player_start = None
		self.sectors = {}
		self.world_path = _WORLD_PATH
		
		if os.path.isfile(world_path):
			self.world_path = world_path
		
		self.set_world_dimensions()
				
	def update(self, dt):
		super().update(dt)
		
	#<----Getters
	def get_string(self, idx):
		return self.string[idx]

	def is_valid_position(self, Px, Py):	
		idx = int(Px) + int(Py) * self.width
		ch = self.get_string(idx)
		# Passable tiles: '.' empty, open door 'D', player/pickup markers (they are replaced with '.')
		passable = {'.', 'D'}
		return True if ch in passable else False

	#<-----Initializer		
	def set_world_dimensions(self):
		# Robustly read the map file into a width,height and a compact string (no newlines)
		with open(self.world_path) as f:
			lines = [ln.rstrip('\n') for ln in f.readlines() if ln.rstrip('\n') != '']
		if not lines:
			self.width = 0
			self.height = 0
			self.string = ''
			return

		self.width = len(lines[0])
		self.height = len(lines)
		# normalize line lengths (pad or trim)
		norm_lines = [ln.ljust(self.width)[:self.width] for ln in lines]
		self.string = ''.join(norm_lines)

		# initialize spawn list and sectors
		self.spawn_list = []
		self.player_start = None
		self.sectors = {}

		# parse special characters into spawns/sectors and clean map (replace markers with passable tiles)
		new_chars = list(self.string)
		for y in range(self.height):
			for x in range(self.width):
				idx = x + y * self.width
				ch = new_chars[idx]
				# Player start
				if ch in ('P', 'p'):
					self.player_start = (x + 0.5, y + 0.5, 0.0)
					new_chars[idx] = '.'
				# Monsters / NPCs
				elif ch in ('N', 'n', 'Z', 'z', 'M', 'm'):
					self.spawn_list.append(('npc_sprite', 'soldier', (x + 0.5, y + 0.5)))
					new_chars[idx] = '.'
				# Pickups / goals
				elif ch in ('g', 'G'):
					self.spawn_list.append(('goal_sprite', 'shot_gun', (x + 0.5, y + 0.5)))
					new_chars[idx] = '.'
				# Doors: 'D' is considered passable/open, 'd' closed
				elif ch == 'd':
					# closed door behaves as wall, leave as-is
					pass
				elif ch == 'D':
					# open door, keep marker but treated as passable
					pass
				# Sector markers A-Z: record indices for sector id
				elif 'A' <= ch <= 'Z':
					self.sectors.setdefault(ch, []).append(idx)
					# leave uppercase as wall marker (renderer may map letter to texture)
				else:
					# leave other characters untouched
					pass

		self.string = ''.join(new_chars)
	#<-----Initializer		
	# Note: set_world_dimensions defined earlier (robust implementation)


