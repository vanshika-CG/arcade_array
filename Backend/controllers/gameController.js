const Game = require('../models/Game');
const User = require('../models/userModel');

// Controller to fetch all games
const getAllGames = async (req, res) => {
  try {
    const games = await Game.find();
    res.json(games);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching games.' });
  }
};

// Controller to add a game to the wishlist
const addToWishlist = async (req, res) => {
  const { userId, gameId } = req.body;

  try {
    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find the game
    const game = await Game.findById(gameId);
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }

    // Add the game to the wishlist
    user.wishlist.push(game);
    await user.save();

    res.status(200).json({ message: 'Game added to wishlist' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error adding game to wishlist' });
  }
};

// Controller to get the user's wishlist
const getUserWishlist = async (req, res) => {
  const { userId } = req.params;

  try {
    // Find the user and populate the wishlist with game details
    const user = await User.findById(userId).populate('wishlist');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(user.wishlist);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching wishlist' });
  }
};

module.exports = { getAllGames, addToWishlist, getUserWishlist };
